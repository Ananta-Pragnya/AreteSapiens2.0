import { BaseRetriever } from '@langchain/core/retrievers';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Regulation, StatutoryExcerpt } from './types';

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9äöüß§\s]/gi, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

// Plain BM25 over the regulation's own statutory text, no embeddings model
// and no API call, so this runs the same whether or not OPENAI_API_KEY is
// set. It exists so every citation and every line of the drafted complaint
// traces back to an actual passage of the actual regulation, not just a
// label string.
class Bm25Retriever extends BaseRetriever {
  lc_namespace = ['claim-guardian', 'retrievers'];

  private docs: Document[];
  private docTokens: string[][];
  private avgDocLen: number;
  private k1 = 1.5;
  private b = 0.75;

  constructor(docs: Document[]) {
    super();
    this.docs = docs;
    this.docTokens = docs.map((d) => tokenize(d.pageContent));
    const totalLen = this.docTokens.reduce((sum, t) => sum + t.length, 0);
    this.avgDocLen = this.docTokens.length ? totalLen / this.docTokens.length : 0;
  }

  private score(queryTokens: string[], docIndex: number): number {
    const tokens = this.docTokens[docIndex];
    const docLen = tokens.length || 1;
    let score = 0;
    for (const term of queryTokens) {
      const tf = tokens.filter((t) => t === term).length;
      if (tf === 0) continue;
      const df = this.docTokens.filter((d) => d.includes(term)).length;
      const idf = Math.log(1 + (this.docs.length - df + 0.5) / (df + 0.5));
      const numerator = tf * (this.k1 + 1);
      const denominator = tf + this.k1 * (1 - this.b + (this.b * docLen) / (this.avgDocLen || 1));
      score += idf * (numerator / denominator);
    }
    return score;
  }

  async _getRelevantDocuments(query: string): Promise<Document[]> {
    const queryTokens = tokenize(query);
    if (!queryTokens.length || !this.docs.length) return [];
    const scored = this.docs.map((doc, i) => ({ doc, score: this.score(queryTokens, i) }));
    scored.sort((a, b) => b.score - a.score);
    return scored.filter((s) => s.score > 0).slice(0, 3).map((s) => s.doc);
  }
}

const retrieverCache = new Map<string, Bm25Retriever>();

async function getRetriever(regulation: Regulation): Promise<Bm25Retriever> {
  const cached = retrieverCache.get(regulation.id);
  if (cached) return cached;

  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 400, chunkOverlap: 40 });
  const docs: Document[] = [];
  for (const excerpt of regulation.statutoryExcerpts) {
    const chunks = await splitter.splitText(excerpt.text);
    for (const chunk of chunks) {
      docs.push(new Document({ pageContent: chunk, metadata: { label: excerpt.label, url: excerpt.url } }));
    }
  }
  const retriever = new Bm25Retriever(docs);
  retrieverCache.set(regulation.id, retriever);
  return retriever;
}

export type RetrievedExcerpt = { label: string; url: string; text: string };

export async function retrieveRelevantContext(query: string, regulation: Regulation): Promise<RetrievedExcerpt[]> {
  const retriever = await getRetriever(regulation);
  const docs = await retriever.invoke(query);
  return docs.map((d) => ({
    label: (d.metadata.label as string) ?? regulation.sourceLabel,
    url: (d.metadata.url as string) ?? '',
    text: d.pageContent,
  }));
}

export async function retrieveContext(query: string, regulation: Regulation): Promise<RetrievedExcerpt[]> {
  const matches = await retrieveRelevantContext(query, regulation);
  if (matches.length) return matches;
  const fallback = regulation.statutoryExcerpts[0];
  return fallback ? [fallback] : [];
}

export function excerptsForRegulation(regulation: Regulation): StatutoryExcerpt[] {
  return regulation.statutoryExcerpts;
}
