import assert from 'node:assert/strict';
import test from 'node:test';
import { LOCAL_CHECK_CODE } from '../lib/localEngine';
import { ocrLanguageForJurisdiction } from '../lib/ocr';
import { runAnalysisPipeline, runPreClaimPipeline } from '../lib/pipeline';
import { REGULATIONS } from '../lib/regulations';
import { retrieveContext } from '../lib/retrieval';
import { runGeneratedAnalysis, UnsafeGeneratedCodeError } from '../lib/sandbox';
import { buildExtractionResult, extractDatesInOrder } from '../lib/structuredExtract';

const regulation = REGULATIONS.US_CA;

test('extracts common US and German date formats in document order', () => {
  assert.deepEqual(extractDatesInOrder('Filed 05/02/2026. Entscheidung 29.05.2026.'), [
    '2026-05-02',
    '2026-05-29',
  ]);
});

test('flags a German document under the California jurisdiction', () => {
  const extraction = buildExtractionResult(
    'Allianz Versicherung. Der Schaden wurde abgelehnt. Versicherung Vertrag.',
    regulation
  );
  assert.equal(extraction.detectedLanguage, 'german');
  assert.match(extraction.jurisdictionWarning ?? '', /German/);
});

test('selects the German OCR model for the Germany jurisdiction', () => {
  assert.equal(ocrLanguageForJurisdiction('EU_DE'), 'deu');
  assert.equal(ocrLanguageForJurisdiction('US_CA'), 'eng');
});

test('sandbox executes the local check and rejects disallowed code', () => {
  const result = runGeneratedAnalysis(LOCAL_CHECK_CODE, {
    insurerName: 'Example Insurance', policyNumber: 'P-1', claimFiledDate: '2026-01-01',
    deniedDate: '2026-03-01', todayDate: '2026-03-02', denialReasonVerbatim: '',
    citedClauseOrCode: '', whatHappened: '', whatWasClaimed: '', whatWasExpected: '',
    requiredDocsRequestedBeforeDenial: 'no',
  }, regulation);
  assert.ok(result.violationCount > 0);
  assert.throws(() => runGeneratedAnalysis('require("fs")', {} as never, regulation), UnsafeGeneratedCodeError);
});

test('retrieval returns a statutory excerpt even for an unmatched query', async () => {
  const excerpts = await retrieveContext('qzxvplm', regulation);
  assert.equal(excerpts.length, 1);
  assert.equal(excerpts[0].label, regulation.statutoryExcerpts[0].label);
});

test('analysis pipeline grounds failed checks in statutory text', async () => {
  const output = await runAnalysisPipeline({
    insurerName: 'Example Insurance', policyNumber: 'P-1', claimFiledDate: '2026-01-01',
    deniedDate: '2026-03-01', todayDate: '2026-03-02', denialReasonVerbatim: '',
    citedClauseOrCode: '', whatHappened: '', whatWasClaimed: '', whatWasExpected: '',
    requiredDocsRequestedBeforeDenial: 'no',
  }, regulation);
  assert.ok(output.result.checks.some((check) => !check.passed && check.citation?.startsWith('"')));
});

test('pre-claim pipeline produces a checklist using the local engine', async () => {
  const output = await runPreClaimPipeline({
    insurerName: 'Example Insurance', policyNumber: 'P-1', coverageCriteria: ['Treatment must be medically necessary.'],
    exclusionsListedVerbatim: ['Cosmetic treatment is excluded.'], requiredDocumentationListed: ['Itemized bill'],
    rawText: '', whatHappened: 'I need medically necessary treatment.', whatWasClaimed: 'Treatment costs',
    whatWasExpected: 'Coverage', requiredDocsRequestedBeforeDenial: 'unknown',
  }, regulation);
  assert.ok(output.result.checklist.length > 0);
});
