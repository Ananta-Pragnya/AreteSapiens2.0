import {
  draftComplaint,
  extractDenialLetter,
  extractPolicyDocument,
  generatePreClaimChecklist,
  generateValidationScript,
  MissingApiKeyError,
  parseNarrative,
} from './openai';
import {
  draftComplaintLocally,
  LOCAL_CHECK_CODE,
  LOCAL_PRECLAIM_CHECK_CODE,
  parseNarrativeLocally,
} from './localEngine';
import { recognizeText } from './ocr';
import { buildExtractionResult, buildPolicyExtractionResult } from './structuredExtract';
import { retrieveContext } from './retrieval';
import {
  AnalysisResult,
  CaseFacts,
  ExtractionResult,
  JurisdictionId,
  NarrativeFacts,
  PolicyExtractionResult,
  PreClaimFacts,
  Regulation,
} from './types';
import { getRegulation } from './regulations';

export type Sourced<T> = { data: T; source: 'gpt' | 'local' };

function hasApiKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

// Every one of these tries GPT first only if a key is configured. With no
// key, or if GPT fails for a reason other than a missing key, it falls
// through to the local engine: real OCR, real regex extraction, and the
// checks in lib/localEngine.ts, all of which run the same way every time,
// for free.

export async function runExtraction(
  imageDataUrl: string,
  jurisdiction: JurisdictionId
): Promise<Sourced<ExtractionResult>> {
  if (hasApiKey()) {
    try {
      const data = await extractDenialLetter(imageDataUrl);
      return { data, source: 'gpt' };
    } catch (err) {
      if (!(err instanceof MissingApiKeyError)) throw err;
    }
  }
  const rawText = await recognizeText(imageDataUrl, jurisdiction);
  const regulation = getRegulation(jurisdiction);
  return { data: buildExtractionResult(rawText, regulation), source: 'local' };
}

export async function runNarrativeParse(text: string): Promise<Sourced<NarrativeFacts>> {
  if (hasApiKey()) {
    try {
      const data = await parseNarrative(text);
      return { data, source: 'gpt' };
    } catch (err) {
      if (!(err instanceof MissingApiKeyError)) throw err;
    }
  }
  return { data: parseNarrativeLocally(text), source: 'local' };
}

export async function runPolicyExtraction(
  imageDataUrl: string,
  jurisdiction: JurisdictionId
): Promise<Sourced<PolicyExtractionResult>> {
  if (hasApiKey()) {
    try {
      const data = await extractPolicyDocument(imageDataUrl);
      return { data, source: 'gpt' };
    } catch (err) {
      if (!(err instanceof MissingApiKeyError)) throw err;
    }
  }
  const rawText = await recognizeText(imageDataUrl, jurisdiction);
  const regulation = getRegulation(jurisdiction);
  return { data: buildPolicyExtractionResult(rawText, regulation), source: 'local' };
}

export async function runCodeGeneration(
  facts: CaseFacts,
  regulation: Regulation
): Promise<Sourced<string>> {
  if (hasApiKey()) {
    try {
      const data = await generateValidationScript(facts, regulation);
      return { data, source: 'gpt' };
    } catch (err) {
      if (!(err instanceof MissingApiKeyError)) throw err;
    }
  }
  return { data: LOCAL_CHECK_CODE, source: 'local' };
}

export async function runPreClaimCheck(
  facts: PreClaimFacts,
  regulation: Regulation
): Promise<Sourced<string>> {
  if (hasApiKey()) {
    try {
      const data = await generatePreClaimChecklist(facts, regulation);
      return { data, source: 'gpt' };
    } catch (err) {
      if (!(err instanceof MissingApiKeyError)) throw err;
    }
  }
  return { data: LOCAL_PRECLAIM_CHECK_CODE, source: 'local' };
}

export async function runComplaintDraft(
  facts: CaseFacts,
  regulation: Regulation,
  analysis: AnalysisResult
): Promise<Sourced<string>> {
  const violations = analysis.checks.filter((c) => !c.passed);
  const excerptsByCheckId: Record<string, Awaited<ReturnType<typeof retrieveContext>>> = {};
  for (const v of violations) {
    excerptsByCheckId[v.id] = await retrieveContext(`${v.label} ${v.detail}`, regulation);
  }

  if (hasApiKey()) {
    try {
      const data = await draftComplaint(facts, regulation, analysis);
      return { data, source: 'gpt' };
    } catch (err) {
      if (!(err instanceof MissingApiKeyError)) throw err;
    }
  }
  return { data: draftComplaintLocally(facts, regulation, analysis, excerptsByCheckId), source: 'local' };
}
