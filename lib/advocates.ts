import { JurisdictionId, Professional } from './types';

export const PROFESSIONALS: Professional[] = [
  { id: 'sample-samira-rowan', name: 'Samira Rowan', title: 'Insurance Claims Attorney', jurisdictions: ['US_CA'], specialties: ['denial_review', 'bad_faith'], tier: 'standard', tier_label: '$250-450/session', years_experience: 11, rating: 4.8, languages: ['English', 'Spanish'], bio: 'Sample profile for this demo. Explains denial letters and possible next steps in plain language.', response_time_hours: 18 },
  { id: 'sample-noor-patel', name: 'Noor Patel', title: 'Coverage Appeal Advisor', jurisdictions: ['US_CA'], specialties: ['appeal', 'underpayment'], tier: 'budget', tier_label: '$90-160/session', years_experience: 6, rating: 4.5, languages: ['English', 'Hindi'], bio: 'Sample profile for this demo. Focuses on organizing a clear appeal record after a disputed claim decision.', response_time_hours: 24 },
  { id: 'sample-klara-weiss', name: 'Klara Weiss', title: 'Insurance Dispute Counsel', jurisdictions: ['EU_DE'], specialties: ['denial_review', 'appeal'], tier: 'standard', tier_label: 'EUR 180-320/session', years_experience: 10, rating: 4.7, languages: ['German', 'English'], bio: 'Sample profile for this demo. Helps make insurance correspondence and supporting records easier to review.', response_time_hours: 20 },
  { id: 'sample-leon-vogt', name: 'Leon Vogt', title: 'Policy Review Advisor', jurisdictions: ['EU_DE'], specialties: ['pre_claim', 'underpayment'], tier: 'premium', tier_label: 'EUR 350+/session', years_experience: 15, rating: 4.9, languages: ['German', 'English'], bio: 'Sample profile for this demo. Reviews what a policyholder may want to collect before filing a claim.', response_time_hours: 12 },
  { id: 'sample-anika-rao', name: 'Anika Rao', title: 'Claims Preparation Advisor', jurisdictions: ['IN'], specialties: ['pre_claim', 'denial_review'], tier: 'free_consult', tier_label: 'Free first call', years_experience: 7, rating: 4.6, languages: ['English', 'Hindi', 'Tamil'], bio: 'Sample profile for this demo. Helps people turn a confusing insurance record into a practical document checklist.', response_time_hours: 16 },
  { id: 'sample-dev-mehta', name: 'Dev Mehta', title: 'Insurance Payment Review Advisor', jurisdictions: ['IN'], specialties: ['underpayment', 'appeal'], tier: 'budget', tier_label: 'Rs.1,500-3,000/session', years_experience: 9, rating: 4.4, languages: ['English', 'Hindi', 'Gujarati'], bio: 'Sample profile for this demo. Focuses on comparing a settlement amount with the documents already on hand.', response_time_hours: 24 },
];

export type ProfessionalFilters = {
  jurisdiction?: JurisdictionId;
  specialty?: string;
  tier?: Professional['tier'];
};

export function findProfessionals(filters: ProfessionalFilters = {}): Professional[] {
  return PROFESSIONALS.filter(
    (professional) =>
      (!filters.jurisdiction || professional.jurisdictions.includes(filters.jurisdiction)) &&
      (!filters.specialty || professional.specialties.includes(filters.specialty)) &&
      (!filters.tier || professional.tier === filters.tier)
  );
}
