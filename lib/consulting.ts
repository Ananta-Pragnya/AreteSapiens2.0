import {
  AnalysisResult,
  CaseFacts,
  EvidenceRecommendation,
  GroundedAnswer,
  PursuitEstimate,
  Regulation,
} from './types';
import { retrieveRelevantContext } from './retrieval';

export async function answerCaseQuestion(
  question: string,
  facts: CaseFacts,
  analysis: AnalysisResult,
  regulation: Regulation
): Promise<GroundedAnswer> {
  const excerpts = await retrieveRelevantContext(question, regulation);
  if (!excerpts.length) {
    return {
      supported: false,
      answer: 'I cannot answer that from the confirmed case record and the available regulatory passages. A claims specialist can review the missing facts with you.',
      citations: [],
    };
  }

  const flagged = analysis.checks.filter((check) => !check.passed);
  const caseSignal = flagged.length
    ? `Your review flagged: ${flagged.map((check) => check.label).join(', ')}.`
    : 'Your review did not identify a clear regulatory failure from the facts entered.';
  const passage = excerpts[0];
  const factsSignal = facts.denialReasonVerbatim
    ? `The recorded insurer reason is: ${facts.denialReasonVerbatim}`
    : 'No insurer reason was confirmed in the case record.';

  return {
    supported: true,
    answer: `${caseSignal} ${factsSignal} The retrieved passage addresses your question as follows: ${passage.text} This is an evidence-based explanation, not a prediction of an outcome.`,
    citations: excerpts,
  };
}

export function buildEvidenceCoach(facts: CaseFacts, analysis: AnalysisResult): EvidenceRecommendation[] {
  const failed = analysis.checks.filter((check) => !check.passed);
  const recommendations: EvidenceRecommendation[] = [];

  if (failed.some((check) => /reason|category/i.test(`${check.id} ${check.label}`))) {
    recommendations.push({
      title: 'Get the insurer decision record',
      detail: 'Keep the denial letter, all policy pages, and any written explanation that links the decision to a specific policy term.',
      citation: failed.find((check) => /reason|category/i.test(`${check.id} ${check.label}`))?.citation,
    });
  }
  if (failed.some((check) => /clause|citation/i.test(`${check.id} ${check.label}`))) {
    recommendations.push({
      title: 'Request the exact policy clause',
      detail: 'Ask the insurer to identify the full policy wording and page number it relied on. Keep their response with your appeal record.',
      citation: failed.find((check) => /clause|citation/i.test(`${check.id} ${check.label}`))?.citation,
    });
  }
  if (failed.some((check) => /document|documentation/i.test(`${check.id} ${check.label}`))) {
    recommendations.push({
      title: 'Build a proof-of-submission file',
      detail: 'Collect each document you sent, delivery confirmation, upload receipt, and every insurer request for further information.',
      citation: failed.find((check) => /document|documentation/i.test(`${check.id} ${check.label}`))?.citation,
    });
  }
  if (facts.denialReasonVerbatim && /medical|necessity|treatment|health/i.test(facts.denialReasonVerbatim)) {
    recommendations.push({
      title: 'Ask for a treating clinician letter',
      detail: 'A concise letter that addresses the stated medical reason and ties the treatment to your records can strengthen the factual record.',
    });
  }
  if (!recommendations.length) {
    recommendations.push({
      title: 'Preserve the complete timeline',
      detail: 'Save the policy, claim submission, insurer messages, receipts, and dates in one place before you take the next step.',
    });
  }
  return recommendations;
}

export function estimatePursuit(analysis: AnalysisResult, claimAmount: number): PursuitEstimate {
  const checks = Math.max(analysis.checks.length, 1);
  const likelihoodPercent = Math.max(20, Math.min(80, Math.round(25 + (analysis.violationCount / checks) * 55)));
  return {
    likelihoodPercent,
    estimatedRecoverableAmount: Math.max(0, claimAmount) * (likelihoodPercent / 100),
    resolutionWindow: analysis.daysLeftToAppeal !== null && analysis.daysLeftToAppeal < 0 ? '6-12 weeks' : '3-6 weeks',
    note: 'This is a transparent planning estimate based on the checks flagged, not a promise of recovery or legal advice.',
  };
}
