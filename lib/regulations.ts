import { JurisdictionId, Regulation } from './types';

// The excerpts below are pulled from the official text of each regulation
// (eCFR/Cornell for the US, gesetze-im-internet.de for Germany, the IRDAI
// regulation itself for India). Deadlines and categories still simplify a
// larger body of law, insurer type and policy terms change the details, so
// this is not legal advice, verify the current text before relying on it.
export const REGULATIONS: Record<JurisdictionId, Regulation> = {
  US_CA: {
    id: 'US_CA',
    label: 'United States (California)',
    sourceLabel: 'Cal. Code Regs. tit. 10, § 2695.7; 29 CFR § 2560.503-1 for employer-sponsored plans',
    decisionDeadlineDays: 40,
    appealWindowDays: 180,
    appealWindowIsStatutory: true,
    validDenialCategories: [
      'not medically necessary',
      'experimental or investigational treatment',
      'not a covered benefit under the plan',
      'pre-existing condition exclusion',
      'lack of required prior authorization',
      'policy lapsed for non-payment of premium',
      'suspected fraud or misrepresentation',
    ],
    requiresWrittenReason: true,
    requiresPolicyClauseCitation: true,
    ombudsmanName: 'California Department of Insurance',
    notes:
      'California requires an accept-or-deny decision within 40 calendar days of proof of claim, and payment within 30 days of acceptance. Employer-sponsored health plans instead run on the federal ERISA claims regulation, which gives 30 days for a post-service claim decision.',
    statutoryExcerpts: [
      {
        label: 'Cal. Code Regs. tit. 10, § 2695.7(b)',
        url: 'https://www.propertyinsurancecoveragelaw.com/blog/know-the-regs-to-use-the-regs-a-look-at-california-fair-claims-settlement-practices-regulations-10-ccr-2695-7/',
        text: 'Upon receiving proof of claim, every insurer shall immediately, but in no event more than forty (40) calendar days later, accept or deny the claim, in whole or in part.',
      },
      {
        label: 'Cal. Code Regs. tit. 10, § 2695.7(b)(1)',
        url: 'https://www.propertyinsurancecoveragelaw.com/blog/know-the-regs-to-use-the-regs-a-look-at-california-fair-claims-settlement-practices-regulations-10-ccr-2695-7/',
        text: 'Where an insurer denies or rejects a first party claim, in whole or in part, it shall do so in writing and shall provide to the claimant a statement listing all bases for such rejection or denial and the factual and legal bases for each reason given.',
      },
      {
        label: 'Cal. Code Regs. tit. 10, § 2695.7(h)',
        url: 'https://www.propertyinsurancecoveragelaw.com/blog/know-the-regs-to-use-the-regs-a-look-at-california-fair-claims-settlement-practices-regulations-10-ccr-2695-7/',
        text: 'Upon acceptance of the claim in whole or in part, every insurer shall immediately, but in no event more than thirty (30) calendar days later, tender payment.',
      },
      {
        label: '29 CFR § 2560.503-1(f)(2)(iii)(B)',
        url: 'https://www.law.cornell.edu/cfr/text/29/2560.503-1',
        text: 'In the case of a post-service claim, the plan administrator shall notify the claimant of the plan’s adverse benefit determination within a reasonable period of time, but not later than 30 days after receipt of the claim.',
      },
      {
        label: '29 CFR § 2560.503-1(g)(1)',
        url: 'https://www.law.cornell.edu/cfr/text/29/2560.503-1',
        text: 'The notification shall set forth, in a manner calculated to be understood by the claimant, the specific reason or reasons for the adverse determination, and reference to the specific plan provisions on which the determination is based.',
      },
    ],
  },
  EU_DE: {
    id: 'EU_DE',
    label: 'European Union (Germany)',
    sourceLabel: 'Versicherungsvertragsgesetz (VVG) § 14',
    decisionDeadlineDays: 30,
    appealWindowDays: 90,
    appealWindowIsStatutory: false,
    validDenialCategories: [
      'risk excluded under the policy terms',
      'breach of pre-contractual disclosure duty (§19 VVG)',
      'non-payment of premium (§38 VVG)',
      'suspected insurance fraud',
      'loss reported outside the notification period',
      'event or peril not covered by the policy',
    ],
    requiresWrittenReason: true,
    requiresPolicyClauseCitation: true,
    ombudsmanName: 'Versicherungsombudsmann e.V.',
    notes:
      'VVG §14 does not set a fixed decision deadline, payment is due once the insurer finishes investigating the claim. If that investigation runs past one month from notification, the policyholder can already demand an advance payment of whatever the insurer will minimally owe. The 30 day figure here is a practical benchmark, not the statute’s own number, and the 90 day appeal window is guidance rather than a hard deadline, check the current Ombudsmann rules.',
    statutoryExcerpts: [
      {
        label: '§ 14 Abs. 1 VVG',
        url: 'https://www.gesetze-im-internet.de/vvg_2008/__14.html',
        text: 'Geldleistungen des Versicherers sind fällig mit der Beendigung der zur Feststellung des Versicherungsfalles und des Umfanges der Leistung des Versicherers notwendigen Erhebungen.',
      },
      {
        label: '§ 14 Abs. 2 VVG',
        url: 'https://www.gesetze-im-internet.de/vvg_2008/__14.html',
        text: 'Sind diese Erhebungen nicht bis zum Ablauf eines Monats seit der Anzeige des Versicherungsfalles beendet, kann der Versicherungsnehmer Abschlagszahlungen in Höhe des Betrags verlangen, den der Versicherer voraussichtlich mindestens zu zahlen hat.',
      },
      {
        label: '§ 14 Abs. 3 VVG',
        url: 'https://www.gesetze-im-internet.de/vvg_2008/__14.html',
        text: 'Eine Vereinbarung, durch die der Versicherer von der Verpflichtung zur Zahlung von Verzugszinsen befreit wird, ist unwirksam.',
      },
    ],
  },
  IN: {
    id: 'IN',
    label: 'India',
    sourceLabel: 'IRDAI (Health Insurance) Regulations, 2016, Regulation 27',
    decisionDeadlineDays: 30,
    appealWindowDays: 365,
    appealWindowIsStatutory: true,
    validDenialCategories: [
      'pre-existing disease within waiting period',
      'non-disclosure of material fact',
      'treatment excluded under the policy schedule',
      'claim filed after policy lapse',
      'sub-limit or capping applies (partial, not full denial)',
      'cosmetic or non-medically-necessary treatment',
    ],
    requiresWrittenReason: true,
    requiresPolicyClauseCitation: true,
    ombudsmanName: 'Insurance Ombudsman (Council for Insurance Ombudsmen)',
    notes:
      'A complaint to the Insurance Ombudsman generally must be filed within one year of the rejection.',
    statutoryExcerpts: [
      {
        label: 'IRDAI (Health Insurance) Regulations, 2016, Reg. 27',
        url: 'https://www.legitquest.com/act/insurance-regulatory-and-development-authority-of-india-health-insurance-regulations-2016/CB53',
        text: 'An insurer shall settle or reject a claim, as may be the case, within thirty days of the receipt of the last necessary document.',
      },
      {
        label: 'IRDAI (Health Insurance) Regulations, 2016, Reg. 27',
        url: 'https://www.legitquest.com/act/insurance-regulatory-and-development-authority-of-india-health-insurance-regulations-2016/CB53',
        text: 'The communication about the denial or the repudiation shall be made only by the Insurer by specifically stating the reasons for the denial or repudiation, while necessarily referring to the corresponding policy conditions, and the insurer shall also furnish the grievance redressal procedures available with the Insurance Company and with the Insurance Ombudsman.',
      },
      {
        label: 'IRDAI (Health Insurance) Regulations, 2016, Reg. 27',
        url: 'https://www.legitquest.com/act/insurance-regulatory-and-development-authority-of-india-health-insurance-regulations-2016/CB53',
        text: 'Except in cases where a fraud is suspected, ordinarily no document not listed in the policy terms and conditions shall be deemed necessary, and all the documents required for claims processing shall be called for at one time, not in a piece-meal manner.',
      },
    ],
  },
};

export function getRegulation(id: JurisdictionId): Regulation {
  const reg = REGULATIONS[id];
  if (!reg) throw new Error(`Unknown jurisdiction: ${id}`);
  return reg;
}
