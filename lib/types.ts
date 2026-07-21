export type JurisdictionId = 'US_CA' | 'EU_DE' | 'IN';

export type StatutoryExcerpt = {
  label: string;
  url: string;
  text: string;
};

export type Regulation = {
  id: JurisdictionId;
  label: string;
  sourceLabel: string;
  decisionDeadlineDays: number;
  appealWindowDays: number;
  appealWindowIsStatutory: boolean;
  validDenialCategories: string[];
  requiresWrittenReason: boolean;
  requiresPolicyClauseCitation: boolean;
  ombudsmanName: string;
  notes: string;
  statutoryExcerpts: StatutoryExcerpt[];
};

export type ExtractionResult = {
  insurerName: string;
  policyNumber: string;
  claimFiledDate: string | null; // ISO yyyy-mm-dd
  deniedDate: string | null; // ISO yyyy-mm-dd
  denialReasonVerbatim: string;
  citedClauseOrCode: string;
  rawText: string;
  detectedLanguage?: 'english' | 'german' | 'unknown';
  jurisdictionWarning?: string;
};

export type PolicyExtractionResult = {
  insurerName: string;
  policyNumber: string;
  coverageCriteria: string[];
  exclusionsListedVerbatim: string[];
  requiredDocumentationListed: string[];
  rawText: string;
  detectedLanguage?: 'english' | 'german' | 'unknown';
  jurisdictionWarning?: string;
};

export type NarrativeFacts = {
  whatHappened: string;
  whatWasClaimed: string;
  whatWasExpected: string;
  requiredDocsRequestedBeforeDenial: 'yes' | 'no' | 'unknown';
};

export type CaseFacts = {
  insurerName: string;
  policyNumber: string;
  claimFiledDate: string | null;
  deniedDate: string | null;
  todayDate: string;
  denialReasonVerbatim: string;
  citedClauseOrCode: string;
  whatHappened: string;
  whatWasClaimed: string;
  whatWasExpected: string;
  requiredDocsRequestedBeforeDenial: 'yes' | 'no' | 'unknown';
};

export type CheckResult = {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
  citation?: string;
};

export type AnalysisResult = {
  checks: CheckResult[];
  violationCount: number;
  daysElapsed: number | null;
  daysOverStatute: number | null;
  appealDeadlineDate: string | null;
  daysLeftToAppeal: number | null;
};

export type PreClaimFacts = PolicyExtractionResult & NarrativeFacts;

export type PreClaimResult = {
  checklist: {
    id: string;
    label: string;
    satisfied: boolean | 'unknown';
    detail: string;
    citation?: string;
  }[];
  likelyRequiredDocs: string[];
  statutoryDecisionDeadlineDays: number;
  notes: string;
};

export type AnalyzeResponse = {
  code: string;
  result: AnalysisResult;
};

export type Professional = {
  id: string;
  name: string;
  title: string;
  jurisdictions: JurisdictionId[];
  specialties: string[];
  tier: 'free_consult' | 'budget' | 'standard' | 'premium';
  tier_label: string;
  years_experience: number;
  rating: number;
  languages: string[];
  bio: string;
  response_time_hours: number;
};

export type ConsultationRequest = {
  id: string;
  professional_id: string;
  case_context: string;
  contact_name: string;
  contact_email: string;
  preferred_tier: string;
  preferred_time: string;
  created_at: string;
  status: 'requested';
};

export type GroundedAnswer = {
  supported: boolean;
  answer: string;
  citations: { label: string; url: string; text: string }[];
};

export type EvidenceRecommendation = {
  title: string;
  detail: string;
  citation?: string;
};

export type PursuitEstimate = {
  likelihoodPercent: number;
  estimatedRecoverableAmount: number;
  resolutionWindow: string;
  note: string;
};
