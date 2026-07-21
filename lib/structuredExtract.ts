import { ExtractionResult, PolicyExtractionResult, Regulation } from './types';

const MONTHS: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toIso(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (year < 1900 || year > 2100) return null;
  return `${year}-${pad(month)}-${pad(day)}`;
}

// Pulls every date-shaped substring out of OCR'd text and normalizes it to
// ISO, in the order it appears in the document. Handles the formats that
// actually show up in denial letters and policy documents: ISO, US
// slash-dates, German dot-dates, and "Month Day, Year" style.
export function extractDatesInOrder(text: string): string[] {
  const dates: { index: number; iso: string }[] = [];

  const isoRe = /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g;
  for (const m of text.matchAll(isoRe)) {
    const iso = toIso(Number(m[1]), Number(m[2]), Number(m[3]));
    if (iso) dates.push({ index: m.index ?? 0, iso });
  }

  const slashRe = /\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/g;
  for (const m of text.matchAll(slashRe)) {
    const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    const iso = toIso(year, Number(m[1]), Number(m[2]));
    if (iso) dates.push({ index: m.index ?? 0, iso });
  }

  const dotRe = /\b(\d{1,2})\.(\d{1,2})\.(\d{2,4})\b/g;
  for (const m of text.matchAll(dotRe)) {
    const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    // German dates are day.month.year, the reverse of the slash format above.
    const iso = toIso(year, Number(m[2]), Number(m[1]));
    if (iso) dates.push({ index: m.index ?? 0, iso });
  }

  const monthNameRe = /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2}),?\s+(\d{4})\b/gi;
  for (const m of text.matchAll(monthNameRe)) {
    const month = MONTHS[m[1].toLowerCase()];
    const iso = month ? toIso(Number(m[3]), month, Number(m[2])) : null;
    if (iso) dates.push({ index: m.index ?? 0, iso });
  }

  const dayMonthNameRe = /\b(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{4})\b/gi;
  for (const m of text.matchAll(dayMonthNameRe)) {
    const month = MONTHS[m[2].toLowerCase()];
    const iso = month ? toIso(Number(m[3]), month, Number(m[1])) : null;
    if (iso) dates.push({ index: m.index ?? 0, iso });
  }

  dates.sort((a, b) => a.index - b.index);
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const d of dates) {
    if (!seen.has(d.iso)) {
      seen.add(d.iso);
      ordered.push(d.iso);
    }
  }
  return ordered;
}

function findDateNear(text: string, keywords: string[]): string | null {
  const lower = text.toLowerCase();
  for (const kw of keywords) {
    const idx = lower.indexOf(kw);
    if (idx === -1) continue;
    const windowText = text.slice(idx, idx + 60);
    const found = extractDatesInOrder(windowText);
    if (found.length) return found[0];
  }
  return null;
}

export function extractPolicyNumber(text: string): string {
  const match = text.match(/(?:policy\s*(?:no\.?|number|#)|versicherungs(?:nummer|nr\.?|schein)|vertragsnummer)\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-\/]{3,20})/i);
  return match ? match[1].trim() : '';
}

export function extractInsurerName(text: string): string {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const withKeyword = lines.find((l) => /(insurance|assurance|health|mutual|allianz|indemnity|versicherung)/i.test(l) && l.length < 60);
  if (withKeyword) return withKeyword.replace(/[.,]+$/, '');
  return lines[0]?.slice(0, 60) ?? '';
}

export function detectDocumentLanguage(text: string): 'english' | 'german' | 'unknown' {
  const germanHits = (text.match(/\b(versicherung|schaden|antrag|ablehnung|vertrag|leistungen|versicherer|nicht)\b/gi) ?? []).length;
  const englishHits = (text.match(/\b(insurance|claim|denied|policy|coverage|benefit|insurer|medical)\b/gi) ?? []).length;
  if (germanHits === englishHits) return 'unknown';
  return germanHits > englishHits ? 'german' : 'english';
}

function jurisdictionWarning(text: string, regulation: Regulation): string | undefined {
  const language = detectDocumentLanguage(text);
  if (regulation.id === 'EU_DE' && language === 'english') {
    return 'This document appears to be in English while Germany is selected. Confirm the jurisdiction before relying on this review.';
  }
  if (regulation.id !== 'EU_DE' && language === 'german') {
    return 'This document appears to be in German while a non-Germany jurisdiction is selected. Confirm the jurisdiction before relying on this review.';
  }
  return undefined;
}

export function extractClauseCode(text: string): string {
  const match = text.match(/(section|clause|regulation|§)\s*\.?\s*(\d+[a-zA-Z]?(?:\.\d+)*(?:\([a-zA-Z0-9]+\))*)/i);
  return match ? `${match[1]} ${match[2]}` : '';
}

export function extractDenialReason(text: string, categories: string[]): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  for (const category of categories) {
    const sentence = sentences.find((s) => s.toLowerCase().includes(category.toLowerCase()));
    if (sentence) return sentence.trim();
  }
  // No category matched, fall back to a sentence that reads like a reason statement.
  const reasonSentence = sentences.find((s) => /(deny|denied|reject|rejected|repudiat|ablehn|abgelehnt)/i.test(s));
  return reasonSentence?.trim() ?? '';
}

export function buildExtractionResult(rawText: string, regulation: Regulation): ExtractionResult {
  const dates = extractDatesInOrder(rawText);
  const filedDate = findDateNear(rawText, ['filed', 'submitted', 'received', 'intimated', 'eingereicht', 'gemeldet']) ?? dates[0] ?? null;
  const deniedDate =
    findDateNear(rawText, ['denied', 'rejected', 'repudiat', 'decision', 'abgelehnt', 'entscheidung']) ??
    dates.find((d) => d !== filedDate) ??
    null;

  return {
    insurerName: extractInsurerName(rawText),
    policyNumber: extractPolicyNumber(rawText),
    claimFiledDate: filedDate,
    deniedDate,
    denialReasonVerbatim: extractDenialReason(rawText, regulation.validDenialCategories),
    citedClauseOrCode: extractClauseCode(rawText),
    rawText,
    detectedLanguage: detectDocumentLanguage(rawText),
    jurisdictionWarning: jurisdictionWarning(rawText, regulation),
  };
}

function extractSentencesMatching(text: string, patterns: RegExp[]): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  return sentences.filter((s) => patterns.some((p) => p.test(s)));
}

export function buildPolicyExtractionResult(rawText: string, regulation: Regulation): PolicyExtractionResult {
  return {
    insurerName: extractInsurerName(rawText),
    policyNumber: extractPolicyNumber(rawText),
    coverageCriteria: extractSentencesMatching(rawText, [/cover(ed|age)/i, /eligib/i, /must be/i, /gedeckt/i, /leistung/i]),
    exclusionsListedVerbatim: extractSentencesMatching(rawText, [/exclu/i, /not covered/i, /does not cover/i, /ausgeschlossen/i]),
    requiredDocumentationListed: extractSentencesMatching(rawText, [/document/i, /invoice/i, /receipt/i, /report/i, /form/i, /unterlage/i, /rechnung/i]),
    rawText,
    detectedLanguage: detectDocumentLanguage(rawText),
    jurisdictionWarning: jurisdictionWarning(rawText, regulation),
  };
}
