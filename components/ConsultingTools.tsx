'use client';

import { FormEvent, useMemo, useState } from 'react';
import { buildEvidenceCoach, estimatePursuit } from '@/lib/consulting';
import { AnalysisResult, CaseFacts, GroundedAnswer, JurisdictionId } from '@/lib/types';

type Props = {
  facts: CaseFacts;
  analysis: AnalysisResult;
  jurisdiction: JurisdictionId;
  onFindSpecialist: () => void;
};

function currencyFor(jurisdiction: JurisdictionId) {
  if (jurisdiction === 'EU_DE') return 'EUR';
  if (jurisdiction === 'IN') return 'Rs.';
  return '$';
}

export default function ConsultingTools({ facts, analysis, jurisdiction, onFindSpecialist }: Props) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<GroundedAnswer | null>(null);
  const [asking, setAsking] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [claimAmount, setClaimAmount] = useState('');
  const [scenario, setScenario] = useState<'documents' | 'clause' | ''>('');
  const [scenarioResult, setScenarioResult] = useState<AnalysisResult | null>(null);
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const evidence = useMemo(() => buildEvidenceCoach(facts, analysis), [facts, analysis]);
  const estimate = estimatePursuit(analysis, Number(claimAmount) || 0);

  async function askGuardian(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuestionError(null);
    setAsking(true);
    try {
      const response = await fetch('/api/guardian-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, facts, analysis, jurisdiction }),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Could not answer that question.');
      setAnswer(await response.json());
    } catch (err) {
      setQuestionError(err instanceof Error ? err.message : 'Could not answer that question.');
    } finally {
      setAsking(false);
    }
  }

  async function runScenario() {
    if (!scenario) return;
    setScenarioLoading(true);
    try {
      const scenarioFacts: CaseFacts = {
        ...facts,
        requiredDocsRequestedBeforeDenial: scenario === 'documents' ? 'yes' : facts.requiredDocsRequestedBeforeDenial,
        citedClauseOrCode: scenario === 'clause' ? facts.citedClauseOrCode || 'Policy clause supplied for this scenario' : facts.citedClauseOrCode,
      };
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facts: scenarioFacts, jurisdiction }),
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setScenarioResult(data.result as AnalysisResult);
    } catch {
      setScenarioResult(null);
    } finally {
      setScenarioLoading(false);
    }
  }

  return (
    <section style={{ marginTop: 40 }}>
      <div className="kicker">Case support</div>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, margin: '8px 0 10px' }}>Make the next step clearer.</h2>
      <p className="lede" style={{ marginBottom: 24 }}>Each tool uses your confirmed case record. It does not replace advice from a qualified professional.</p>

      <div className="extract">
        <div className="extract-row" style={{ display: 'block' }}>
          <strong>Ask Guardian</strong>
          <p className="cite">Answers are limited to your record and relevant retrieved regulation text.</p>
          <form onSubmit={askGuardian} style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <input aria-label="Ask a question about this case" required value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="What does this deadline mean for my case?" />
            <button className="btn primary" type="submit" disabled={asking}>{asking ? 'Checking' : 'Ask Guardian'}</button>
          </form>
          {questionError && <div className="error-block">{questionError}</div>}
          {answer && (
            <div className="result-row" style={{ marginTop: 14 }}>
              <strong>{answer.supported ? 'Grounded answer' : 'A specialist should review this'}</strong>
              <div className="cite">{answer.answer}</div>
              {answer.citations.map((citation) => <div className="cite" key={`${citation.label}-${citation.text}`}>Source: {citation.label} · {citation.text}</div>)}
              {!answer.supported && <button type="button" className="text-link" style={{ marginTop: 10 }} onClick={onFindSpecialist}>Find a claims specialist for this case</button>}
            </div>
          )}
        </div>
      </div>

      <div className="extract" style={{ marginTop: 16 }}>
        <div className="extract-row" style={{ display: 'block' }}>
          <strong>Evidence coach</strong>
          <p className="cite">These are practical records that could make your case easier to review.</p>
          {evidence.map((item) => (
            <div className="result-row ok" key={item.title}>
              <strong>{item.title}</strong>
              <div className="cite">{item.detail}</div>
              {item.citation && <div className="cite">{item.citation}</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="extract" style={{ marginTop: 16 }}>
        <div className="extract-row" style={{ display: 'block' }}>
          <strong>Is this worth pursuing?</strong>
          <p className="cite">A planning estimate, not a promise of recovery.</p>
          <label className="field-label">Claim amount ({currencyFor(jurisdiction)})<input inputMode="decimal" value={claimAmount} onChange={(event) => setClaimAmount(event.target.value)} placeholder="Enter the amount in dispute" /></label>
          {claimAmount && (
            <div className="notice">
              <span>Estimated recoverable amount</span>
              <b>{currencyFor(jurisdiction)}{estimate.estimatedRecoverableAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</b>
              <div className="cite">Signal strength: {estimate.likelihoodPercent}%. Typical resolution: {estimate.resolutionWindow}. {estimate.note}</div>
            </div>
          )}
        </div>
      </div>

      <div className="extract" style={{ marginTop: 16 }}>
        <div className="extract-row" style={{ display: 'block' }}>
          <strong>What if?</strong>
          <p className="cite">Test a different confirmed fact before you rely on it in an appeal.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
            <select aria-label="Scenario" value={scenario} onChange={(event) => setScenario(event.target.value as 'documents' | 'clause' | '')}>
              <option value="">Choose a scenario</option>
              <option value="documents">The insurer requested documents before denial</option>
              <option value="clause">The letter cited a specific policy clause</option>
            </select>
            <button type="button" className="btn" onClick={runScenario} disabled={!scenario || scenarioLoading}>{scenarioLoading ? 'Rechecking' : 'Run scenario'}</button>
          </div>
          {scenarioResult && <div className="notice"><span>Scenario result</span><b>{scenarioResult.violationCount} issues flagged</b><div className="cite">Current review: {analysis.violationCount} issues flagged. This comparison only changes the fact selected above.</div></div>}
        </div>
      </div>
    </section>
  );
}
