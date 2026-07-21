import { AnalysisResult, CaseFacts, JurisdictionId } from './types';

export type SavedCase = {
  id: string;
  savedAt: string;
  jurisdiction: JurisdictionId;
  facts: CaseFacts;
  code: string | null;
  analysis: AnalysisResult;
  letter: string;
};

const KEY = 'claim-guardian:cases';

function readAll(): SavedCase[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedCase[]) : [];
  } catch {
    return [];
  }
}

export function listSavedCases(): SavedCase[] {
  return readAll().sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export function getSavedCase(id: string): SavedCase | undefined {
  return readAll().find((c) => c.id === id);
}

export function saveCase(entry: SavedCase) {
  const all = readAll().filter((c) => c.id !== entry.id);
  all.push(entry);
  window.localStorage.setItem(KEY, JSON.stringify(all));
}
