'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { findProfessionals } from '@/lib/advocates';
import { saveConsultationRequest } from '@/lib/consultationRequests';
import { AnalysisResult, JurisdictionId, Professional } from '@/lib/types';

type Props = {
  jurisdiction: JurisdictionId;
  analysis: AnalysisResult | null;
  initialSpecialty?: string;
  onBack: () => void;
};

const SPECIALTY_LABELS: Record<string, string> = {
  denial_review: 'Denial review',
  bad_faith: 'Bad faith',
  pre_claim: 'Before filing',
  appeal: 'Appeal support',
  underpayment: 'Underpayment',
};

const TIER_LABELS: Record<Professional['tier'], string> = {
  free_consult: 'Free first call',
  budget: 'Budget',
  standard: 'Standard',
  premium: 'Premium',
};

function analysisContext(analysis: AnalysisResult | null): string {
  if (!analysis) return '';
  return analysis.checks
    .filter((check) => !check.passed)
    .map((check) => `${check.label}: ${check.detail}${check.citation ? ` (${check.citation})` : ''}`)
    .join('\n');
}

export default function Bench({ jurisdiction, analysis, initialSpecialty, onBack }: Props) {
  const [specialty, setSpecialty] = useState(initialSpecialty ?? '');
  const [tier, setTier] = useState<Professional['tier'] | ''>('');
  const [selected, setSelected] = useState<Professional | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [caseContext, setCaseContext] = useState(analysisContext(analysis));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSpecialty(initialSpecialty ?? '');
  }, [initialSpecialty]);

  const professionals = useMemo(
    () => findProfessionals({ jurisdiction, specialty: specialty || undefined, tier: tier || undefined }),
    [jurisdiction, specialty, tier]
  );

  function beginRequest(professional: Professional) {
    setSelected(professional);
    setSaved(false);
    setCaseContext(analysisContext(analysis));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    saveConsultationRequest({
      id: `consult-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      professional_id: selected.id,
      case_context: caseContext.trim(),
      contact_name: contactName.trim(),
      contact_email: contactEmail.trim(),
      preferred_tier: selected.tier,
      preferred_time: preferredTime.trim(),
      created_at: new Date().toISOString(),
      status: 'requested',
    });
    setSaved(true);
  }

  return (
    <div>
      <div className="kicker">Sample directory for this demo, filter by what you can spend</div>
      <h1>The Bench</h1>
      <p className="lede">
        These are fictional placeholder profiles. A request is saved only on this device and does not contact anyone.
      </p>

      {!selected && (
        <>
          <label className="field-label">
            Specialty
            <select value={specialty} onChange={(event) => setSpecialty(event.target.value)}>
              <option value="">Any specialty</option>
              {Object.entries(SPECIALTY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="field-label">
            Budget
            <select value={tier} onChange={(event) => setTier(event.target.value as Professional['tier'] | '')}>
              <option value="">Any budget</option>
              {Object.entries(TIER_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>

          <div className="extract" style={{ marginTop: 24 }}>
            {professionals.length === 0 && <div className="extract-row"><span className="extract-value">No sample profiles match these filters.</span></div>}
            {professionals.map((professional) => (
              <div className="extract-row" key={professional.id}>
                <span className="extract-key">{professional.name}</span>
                <span className="extract-value">
                  <strong>{professional.title}</strong><br />
                  {professional.bio}<br />
                  {professional.jurisdictions.join(', ')} · {professional.languages.join(', ')}<br />
                  {professional.years_experience} years · Rating {professional.rating.toFixed(1)} · Responds within {professional.response_time_hours} hours
                </span>
                <span>
                  <span className="source-tag">{professional.tier_label}</span>
                  <button type="button" className="text-link" onClick={() => beginRequest(professional)}>Request a consultation</button>
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {selected && !saved && (
        <form onSubmit={submit}>
          <div className="result-intro">
            <b>Request a consultation with {selected.name}</b>
            <span>This demo saves your request on this device. It does not contact this fictional profile.</span>
          </div>
          <label className="field-label">Case context<textarea required value={caseContext} onChange={(event) => setCaseContext(event.target.value)} /></label>
          <label className="field-label">Your name<input required value={contactName} onChange={(event) => setContactName(event.target.value)} /></label>
          <label className="field-label">Email<input required type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} /></label>
          <label className="field-label">Preferred time<textarea required value={preferredTime} onChange={(event) => setPreferredTime(event.target.value)} placeholder="Weekday evenings" /></label>
          <div className="actions">
            <button type="button" className="back" onClick={() => setSelected(null)}>Back to directory</button>
            <button type="submit" className="btn primary">Save consultation request</button>
          </div>
        </form>
      )}

      {selected && saved && (
        <div className="result-intro">
          <b>Request saved.</b>
          <span>{selected.name} typically responds within {selected.response_time_hours} hours. This is a demo confirmation only. No professional has been contacted.</span>
          <div style={{ marginTop: 16 }}><button type="button" className="btn primary" onClick={onBack}>Return to your case</button></div>
        </div>
      )}

      {!selected && <div className="actions"><button type="button" className="back" onClick={onBack}>Back to your case</button></div>}
    </div>
  );
}
