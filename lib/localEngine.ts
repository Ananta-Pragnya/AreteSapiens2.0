import { AnalysisResult, CaseFacts, NarrativeFacts, Regulation } from './types';
import { RetrievedExcerpt } from './retrieval';

// This is the engine Claim Guardian runs on by default: no API key, no
// per-call cost, works offline once tesseract's model is cached. It is not
// a stand-in for something better, the compliance math and the citations
// here are the real thing. An OpenAI key on top of this only upgrades OCR
// quality, narrative understanding, and prose, it does not replace this.

export function parseNarrativeLocally(rawText: string): NarrativeFacts {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  let requiredDocsRequestedBeforeDenial: NarrativeFacts['requiredDocsRequestedBeforeDenial'] = 'unknown';
  if (/(never asked|without asking|without requesting|did not ask|didn't ask|no request for)/i.test(lower)) {
    requiredDocsRequestedBeforeDenial = 'no';
  } else if (/(asked me for|requested (my|the) documents|asked for (my|additional))/i.test(lower)) {
    requiredDocsRequestedBeforeDenial = 'yes';
  }

  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const claimedSentence = sentences.find((s) => /\b(claim|claimed|submitted|filed)\b/i.test(s));
  const expectedSentence = sentences.find((s) => /\b(expect|should|owed|entitled)\b/i.test(s));

  return {
    whatHappened: text || 'Not provided, add details on the confirm screen.',
    whatWasClaimed: claimedSentence ?? '',
    whatWasExpected: expectedSentence ?? '',
    requiredDocsRequestedBeforeDenial,
  };
}

export const LOCAL_CHECK_CODE = `function daysBetween(a, b) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function matchesCategory(reason, categories) {
  const lower = reason.toLowerCase();
  return categories.some((cat) => lower.indexOf(cat.toLowerCase()) !== -1);
}

function analyzeCase(facts, regulation) {
  const checks = [];
  let daysElapsed = null;
  let daysOverStatute = null;

  if (facts.claimFiledDate) {
    const endDate = facts.deniedDate || facts.todayDate;
    daysElapsed = daysBetween(facts.claimFiledDate, endDate);
    const overLimit = daysElapsed > regulation.decisionDeadlineDays;
    daysOverStatute = overLimit ? daysElapsed - regulation.decisionDeadlineDays : 0;
    checks.push({
      id: 'timeliness',
      label: 'Response time within statutory limit',
      passed: !overLimit,
      detail: daysElapsed + ' days used, ' + regulation.decisionDeadlineDays + ' allowed',
      citation: overLimit ? regulation.sourceLabel : undefined,
    });
  } else {
    checks.push({
      id: 'timeliness',
      label: 'Response time within statutory limit',
      passed: true,
      detail: 'No claim filed date on record, cannot compute this one.',
    });
  }

  const reasonOk = facts.denialReasonVerbatim
    ? matchesCategory(facts.denialReasonVerbatim, regulation.validDenialCategories)
    : false;
  checks.push({
    id: 'reason-category',
    label: 'Denial reason matches a valid disclosed category',
    passed: reasonOk,
    detail: reasonOk
      ? 'The stated reason lines up with a category the regulation recognizes.'
      : 'The stated reason does not clearly match any category the regulation lists.',
    citation: reasonOk ? undefined : regulation.sourceLabel,
  });

  if (regulation.requiresPolicyClauseCitation) {
    const hasClause = Boolean(facts.citedClauseOrCode && facts.citedClauseOrCode.trim());
    checks.push({
      id: 'clause-cited',
      label: 'Policy clause or code cited in the denial',
      passed: hasClause,
      detail: hasClause ? 'A specific clause was cited.' : 'No specific policy clause or code was cited.',
      citation: hasClause ? undefined : regulation.sourceLabel,
    });
  }

  const docsFirst = facts.requiredDocsRequestedBeforeDenial !== 'no';
  checks.push({
    id: 'docs-requested',
    label: 'Required documentation requested before denial',
    passed: docsFirst,
    detail: docsFirst
      ? 'No record of the insurer denying before asking for required documents.'
      : 'The insurer denied the claim without first requesting required documentation.',
    citation: docsFirst ? undefined : regulation.sourceLabel,
  });

  let appealDeadlineDate = null;
  let daysLeftToAppeal = null;
  if (facts.deniedDate) {
    const deadline = new Date(facts.deniedDate);
    deadline.setDate(deadline.getDate() + regulation.appealWindowDays);
    appealDeadlineDate = deadline.toISOString().slice(0, 10);
    daysLeftToAppeal = daysBetween(facts.todayDate, appealDeadlineDate);
  }

  const violationCount = checks.filter((c) => !c.passed).length;

  return {
    checks,
    violationCount,
    daysElapsed,
    daysOverStatute,
    appealDeadlineDate,
    daysLeftToAppeal,
  };
}`;

export const LOCAL_PRECLAIM_CHECK_CODE = `function includesText(items, text) {
  const lower = text.toLowerCase();
  return items.some((item) => lower.indexOf(item.toLowerCase()) !== -1);
}

function checkPreClaim(facts, regulation) {
  const checklist = [];
  const account = [facts.whatHappened, facts.whatWasClaimed, facts.whatWasExpected].filter(Boolean).join(' ');
  const hasAccount = Boolean(account.trim());
  const hasCriteria = facts.coverageCriteria && facts.coverageCriteria.length > 0;
  const hasPolicyDocs = facts.requiredDocumentationListed && facts.requiredDocumentationListed.length > 0;

  checklist.push({
    id: 'coverage-details',
    label: 'Situation has enough detail for a coverage review',
    satisfied: hasAccount && hasCriteria ? true : 'unknown',
    detail: hasAccount && hasCriteria
      ? 'Your account and the policy coverage criteria are available for comparison before filing.'
      : 'Add details about what happened and what you are claiming, then compare them with the policy criteria.',
    citation: hasCriteria ? undefined : regulation.sourceLabel,
  });

  const exclusions = facts.exclusionsListedVerbatim || [];
  const exclusionMatch = hasAccount && exclusions.length ? includesText(exclusions, account) : false;
  checklist.push({
    id: 'exclusions',
    label: 'No listed exclusion clearly blocks the situation',
    satisfied: exclusionMatch ? false : (hasAccount && exclusions.length ? true : 'unknown'),
    detail: exclusionMatch
      ? 'Your description appears to overlap with a listed exclusion. Review the exact policy wording before filing.'
      : (hasAccount && exclusions.length
        ? 'No listed exclusion clearly matches the description provided.'
        : 'The policy or situation does not provide enough detail to assess exclusions.'),
    citation: exclusionMatch ? regulation.sourceLabel : undefined,
  });

  checklist.push({
    id: 'documentation',
    label: 'Likely claim documentation is identified',
    satisfied: hasPolicyDocs ? true : 'unknown',
    detail: hasPolicyDocs
      ? facts.requiredDocumentationListed.length + ' policy-listed document types are ready to collect.'
      : 'No required documents were identified in the policy text. Ask the insurer for its claim checklist.',
  });

  checklist.push({
    id: 'policy-details',
    label: 'Policy and insurer details are recorded',
    satisfied: facts.insurerName && facts.policyNumber ? true : 'unknown',
    detail: facts.insurerName && facts.policyNumber
      ? 'Insurer and policy number were found in the policy document.'
      : 'Record the insurer name and policy number with your claim materials.',
  });

  return {
    checklist,
    likelyRequiredDocs: facts.requiredDocumentationListed || [],
    statutoryDecisionDeadlineDays: regulation.decisionDeadlineDays,
    notes: 'The insurer response period generally begins after it receives all reasonably required documentation. ' + regulation.notes,
  };
}`;

export function draftComplaintLocally(
  facts: CaseFacts,
  regulation: Regulation,
  analysis: AnalysisResult,
  excerptsByCheckId: Record<string, RetrievedExcerpt[]>
): string {
  const violations = analysis.checks.filter((c) => !c.passed);
  const today = facts.todayDate;

  const violationLines = violations
    .map((v, i) => {
      const excerpts = excerptsByCheckId[v.id] ?? [];
      const quoted = excerpts
        .map((e) => `   "${e.text}" (${e.label})`)
        .join('\n');
      return `${i + 1}. ${v.label}\n   ${v.detail}${quoted ? `\n${quoted}` : v.citation ? `\n   Citation: ${v.citation}` : ''}`;
    })
    .join('\n\n');

  return `To: ${regulation.ombudsmanName}
Date: ${today}

Re: Complaint regarding claim under policy ${facts.policyNumber || '[policy number]'}, ${facts.insurerName || '[insurer]'}

I am writing to file a complaint regarding the handling of my insurance claim by ${facts.insurerName || 'my insurer'}.

Claim filed: ${facts.claimFiledDate || 'unknown'}
Denied on: ${facts.deniedDate || 'unknown'}
Reason given by insurer: "${facts.denialReasonVerbatim || 'not stated'}"

What happened: ${facts.whatHappened || 'see attached documentation'}

Based on a review of this claim against ${regulation.sourceLabel}, I believe the following violations occurred:

${violationLines || 'No violations were flagged, this letter documents the case for the record.'}

I am requesting that this claim be reconsidered and that the insurer provide a written explanation addressing each point above, or reverse the denial. I have attached the denial letter and supporting documentation.

Sincerely,
[Your name]

Generated by Claim Guardian's local engine from the confirmed case facts. Not legal advice.`;
}
