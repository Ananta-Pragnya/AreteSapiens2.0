import { createWorker } from 'tesseract.js';
import { JurisdictionId } from './types';

export function ocrLanguageForJurisdiction(jurisdiction: JurisdictionId): 'eng' | 'deu' {
  return jurisdiction === 'EU_DE' ? 'deu' : 'eng';
}

// Runs entirely locally, no API key and no per-call cost. Tesseract pulls
// its English traineddata once on first use and caches it, everything after
// that is offline.
export async function recognizeText(
  imageDataUrl: string,
  jurisdiction: JurisdictionId
): Promise<string> {
  const worker = await createWorker(ocrLanguageForJurisdiction(jurisdiction));
  try {
    const { data } = await worker.recognize(imageDataUrl);
    return data.text;
  } finally {
    await worker.terminate();
  }
}
