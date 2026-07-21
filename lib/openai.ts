import OpenAI from 'openai';
import {
  AnalysisResult,
  CaseFacts,
  ExtractionResult,
  NarrativeFacts,
  PolicyExtractionResult,
  PreClaimFacts,
  PreClaimResult,
  Regulation,
} from './types';

let client: OpenAI | null = null;

export class MissingApiKeyError extends Error {
  constructor() {
    super(
      'OPENAI_API_KEY is not set. Copy .env.local.example to .env.local and add your key, then restart the dev server.'
    );
    this.name = 'MissingApiKeyError';
  }
}

function getClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new MissingApiKeyError();
  }
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  return JSON.parse(candidate.trim());
}

function extractCode(text: string): string {
  const fenced = text.match(/```(?:js|javascript)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : text).trim();
}

export async function extractDenialLetter(
  imageDataUrl: string
): Promise<ExtractionResult> {
  const openai = getClient();
  const model = process.env.OPENAI_VISION_MODEL || 'gpt-4o';

  const response = await openai.chat.completions.create({
    model,
    temperature: 0,
    messages: [
      {
        role: 'system',
        content:
          'You extract structured facts from photographed insurance claim denial or delay letters. ' +
          'Read the document exactly as written. Do not infer or guess values that are not present, use an empty string instead. ' +
          'Dates must be normalized to ISO 8601 (yyyy-mm-dd) if present, otherwise null. ' +
          'Reply with ONLY a JSON object, no prose, matching exactly this shape: ' +
          '{"insurerName": string, "policyNumber": string, "claimFiledDate": string|null, "deniedDate": string|null, ' +
          '"denialReasonVerbatim": string, "citedClauseOrCode": string, "rawText": string}. ' +
          '"denialReasonVerbatim" must be the exact quoted reason text from the letter. ' +
          '"rawText" is the full transcribed text of the letter.',
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: imageDataUrl },
          },
          {
            type: 'text',
            text: 'Extract the structured fields from this denial/delay letter.',
          },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content ?? '';
  const parsed = extractJson(content) as ExtractionResult;
  return parsed;
}

export async function extractPolicyDocument(
  imageDataUrl: string
): Promise<PolicyExtractionResult> {
  const openai = getClient();
  const model = process.env.OPENAI_VISION_MODEL || 'gpt-4o';

  const response = await openai.chat.completions.create({
    model,
    temperature: 0,
    messages: [
      {
        role: 'system',
        content:
          'You extract structured facts from photographed insurance policy documents. ' +
          'Read the document exactly as written. Do not infer or guess values that are not present, use an empty string or empty array instead. ' +
          'Reply with ONLY a JSON object, no prose, matching exactly this shape: ' +
          '{"insurerName": string, "policyNumber": string, "coverageCriteria": string[], ' +
          '"exclusionsListedVerbatim": string[], "requiredDocumentationListed": string[], "rawText": string}. ' +
          'Keep exclusions and required documentation verbatim where they are stated. ' +
          '"rawText" is the full transcribed text of the policy document.',
      },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageDataUrl } },
          { type: 'text', text: 'Extract the structured fields from this policy document.' },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content ?? '';
  return extractJson(content) as PolicyExtractionResult;
}

export async function parseNarrative(text: string): Promise<NarrativeFacts> {
  const openai = getClient();
  const model = process.env.OPENAI_TEXT_MODEL || 'gpt-4o';

  const response = await openai.chat.completions.create({
    model,
    temperature: 0,
    messages: [
      {
        role: 'system',
        content:
          'You convert a claimant\'s spoken or typed account of an insurance claim into structured facts. ' +
          'Reply with ONLY a JSON object matching exactly: ' +
          '{"whatHappened": string, "whatWasClaimed": string, "whatWasExpected": string, ' +
          '"requiredDocsRequestedBeforeDenial": "yes"|"no"|"unknown"}. ' +
          '"requiredDocsRequestedBeforeDenial" should be "yes" only if the narrative clearly states the insurer asked for ' +
          'specific documents before denying, "no" if it clearly states they were never asked, otherwise "unknown".',
      },
      { role: 'user', content: text },
    ],
  });

  const content = response.choices[0]?.message?.content ?? '';
  return extractJson(content) as NarrativeFacts;
}

export async function transcribeAudio(
  file: File
): Promise<string> {
  const openai = getClient();
  const model = process.env.OPENAI_TRANSCRIBE_MODEL || 'whisper-1';
  const transcription = await openai.audio.transcriptions.create({
    file,
    model,
  });
  return transcription.text;
}

const ANALYZE_CASE_CONTRACT = `
function analyzeCase(facts, regulation) {
  // facts: { insurerName, policyNumber, claimFiledDate, deniedDate, todayDate,
  //          denialReasonVerbatim, citedClauseOrCode, whatHappened, whatWasClaimed,
  //          whatWasExpected, requiredDocsRequestedBeforeDenial }
  //   all dates are ISO strings "yyyy-mm-dd" or null.
  // regulation: { decisionDeadlineDays, appealWindowDays, validDenialCategories,
  //               requiresWrittenReason, requiresPolicyClauseCitation, sourceLabel }
  // returns: {
  //   checks: [{ id, label, passed, detail, citation }],
  //   violationCount,
  //   daysElapsed, daysOverStatute, appealDeadlineDate, daysLeftToAppeal
  // }
}
`;

export async function generateValidationScript(
  facts: CaseFacts,
  regulation: Regulation
): Promise<string> {
  const openai = getClient();
  const model = process.env.OPENAI_CODEGEN_MODEL || 'gpt-4o';

  const response = await openai.chat.completions.create({
    model,
    temperature: 0,
    messages: [
      {
        role: 'system',
        content:
          'You are a code generator that writes a single, self-contained, pure JavaScript function ' +
          'implementing regulatory compliance checks for an insurance claim denial, given the exact case facts ' +
          'and jurisdiction regulation dataset provided by the caller. ' +
          'Your code will run in a restricted vm sandbox: no require, import, process, fetch, or filesystem access. ' +
          'Only use Math, JSON, and Date. Do not fabricate facts not present in the input, if a needed date is null ' +
          'produce a check that reports it cannot be computed instead of guessing. ' +
          'Write at least these checks: ' +
          '(1) whether the days between claimFiledDate and deniedDate (or todayDate if deniedDate is null) exceed ' +
          'regulation.decisionDeadlineDays, ' +
          '(2) whether facts.denialReasonVerbatim plausibly matches one of regulation.validDenialCategories ' +
          '(case-insensitive substring/keyword match is fine), flag as a violation if it does not clearly match any category, ' +
          '(3) if regulation.requiresPolicyClauseCitation is true, whether facts.citedClauseOrCode is non-empty, ' +
          '(4) whether facts.requiredDocsRequestedBeforeDenial is "no" (flag as a violation, since that means the insurer ' +
          'denied before requesting required docs), ' +
          'and compute appealDeadlineDate as deniedDate + regulation.appealWindowDays, with daysLeftToAppeal from todayDate. ' +
          'Follow this exact function contract:\n' +
          ANALYZE_CASE_CONTRACT +
          '\nReply with ONLY the JavaScript code for the analyzeCase function (and any small pure helper functions it needs), ' +
          'in a single fenced code block. No explanation.',
      },
      {
        role: 'user',
        content: JSON.stringify({ facts, regulation }, null, 2),
      },
    ],
  });

  const content = response.choices[0]?.message?.content ?? '';
  return extractCode(content);
}

const PRECLAIM_CONTRACT = `
function checkPreClaim(facts, regulation) {
  // facts: { insurerName, policyNumber, coverageCriteria, exclusionsListedVerbatim,
  //          requiredDocumentationListed, rawText, whatHappened, whatWasClaimed, whatWasExpected,
  //          requiredDocsRequestedBeforeDenial }
  // regulation: { decisionDeadlineDays, sourceLabel, notes }
  // returns: { checklist: [{ id, label, satisfied, detail, citation }], likelyRequiredDocs,
  //            statutoryDecisionDeadlineDays, notes }
}
`;

export async function generatePreClaimChecklist(
  facts: PreClaimFacts,
  regulation: Regulation
): Promise<string> {
  const openai = getClient();
  const model = process.env.OPENAI_CODEGEN_MODEL || 'gpt-4o';
  const response = await openai.chat.completions.create({
    model,
    temperature: 0,
    messages: [
      {
        role: 'system',
        content:
          'You are a code generator that writes a single, self-contained, pure JavaScript function ' +
          'to prepare an insurance claim before it is filed. Your code will run in a restricted vm sandbox: ' +
          'no require, import, process, fetch, or filesystem access. Only use Math, JSON, and Date. ' +
          'Do not fabricate facts. For each uncertain requirement, return satisfied: "unknown" instead of guessing. ' +
          'Write checks for whether the reported situation has enough detail to compare against coverage criteria, ' +
          'whether it appears to match a listed exclusion, and whether policy-listed documentation is identified. ' +
          'Return likelyRequiredDocs from the policy documentation list, adding only broadly applicable items clearly supported by the facts. ' +
          'Include regulation.decisionDeadlineDays and a concise note that the deadline runs after all required documentation is received. ' +
          'Follow this exact function contract:\n' +
          PRECLAIM_CONTRACT +
          '\nReply with ONLY the JavaScript code for the checkPreClaim function (and any small pure helper functions it needs), ' +
          'in a single fenced code block. No explanation.',
      },
      { role: 'user', content: JSON.stringify({ facts, regulation }, null, 2) },
    ],
  });

  const content = response.choices[0]?.message?.content ?? '';
  return extractCode(content);
}

export async function draftComplaint(
  facts: CaseFacts,
  regulation: Regulation,
  analysis: AnalysisResult
): Promise<string> {
  const openai = getClient();
  const model = process.env.OPENAI_WRITER_MODEL || 'gpt-4o';

  const violations = analysis.checks.filter((c) => !c.passed);

  const response = await openai.chat.completions.create({
    model,
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content:
          'You draft a formal, plain-language complaint letter for a consumer to file with an insurance ' +
          'ombudsman or regulator, based on confirmed regulatory violations in their claim denial. ' +
          'Be precise and factual, cite the specific regulation source label given, cite each violation, and ' +
          'request specific relief (reversal of denial, or explanation, and any applicable penalty/interest ' +
          'the jurisdiction provides for late settlement if known). Do not invent facts. ' +
          'Output the letter as plain text, ready to copy or export, addressed to the relevant ombudsman/regulator named in the input. ' +
          'Do not use markdown formatting.',
      },
      {
        role: 'user',
        content: JSON.stringify({ facts, regulation, violations }, null, 2),
      },
    ],
  });

  return response.choices[0]?.message?.content ?? '';
}
