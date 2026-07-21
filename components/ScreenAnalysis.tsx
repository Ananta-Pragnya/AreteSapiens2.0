'use client';

import { useState } from 'react';
import { AnalysisResult, CaseFacts, JurisdictionId, Regulation } from '@/lib/types';
import SourceBadge from './SourceBadge';
import ConsultingTools from './ConsultingTools';

type Props = {
  progressLines: string[];
  code: string | null;
  result: AnalysisResult | null;
  regulation: Regulation;
  facts: CaseFacts;
  jurisdiction: JurisdictionId;
  onGenerateComplaint: () => void;
  onFindSpecialist: () => void;
  loading: boolean;
  error: string | null;
  codeSource: 'gpt' | 'local' | null;
};

export default function ScreenAnalysis({
  progressLines,
  code,
  result,
  regulation,
  facts,
  jurisdiction,
  onGenerateComplaint,
  onFindSpecialist,
  loading,
  error,
  codeSource,
}: Props) {
  const [showCode, setShowCode] = useState(false);

  return (
    <div>
      <div className="kicker">Your review</div>
      <h1>
        {result
          ? result.violationCount > 0
            ? `We found ${result.violationCount} issue${result.violationCount === 1 ? '' : 's'} worth acting on.`
            : 'We did not find a clear violation.'
          : 'Checking your case…'}
      </h1>
      <p className="lede">
        These findings are based on the record you confirmed and the {regulation.label} rules
        that apply to your case.
      </p>

      {!result &&
        progressLines.map((line, i) => (
          <div key={i} className="cite" style={{ marginBottom: 4 }}>
            {line}
          </div>
        ))}

      {error && <div className="error-block">{error}</div>}

      {result && (
        <>
          <div className="result-intro">
            <b>
              {result.violationCount} of {result.checks.length} checks flagged
            </b>
            <span>Review the evidence below before preparing a complaint.</span>
          </div>

          {result.checks.map((check) => (
            <div className={`result-row ${check.passed ? 'ok' : ''}`} key={check.id}>
              <strong>{check.label}</strong>
              <div className="cite">
                {check.detail}
                {!check.passed && check.citation ? ` · ${check.citation}` : ''}
              </div>
            </div>
          ))}

          <button type="button" className="text-link" style={{ marginTop: 22 }} onClick={() => setShowCode((s) => !s)}>
            {showCode ? 'Hide exactly how we checked this' : 'See exactly how we checked this'}
          </button>
          <SourceBadge source={codeSource} liveLabel="generated per case" />
          {showCode && code && <pre className="code open">{code}</pre>}

          {result.daysLeftToAppeal !== null && (
            <div className="notice">
              <span>Days left to appeal</span>
              <b>{result.daysLeftToAppeal >= 0 ? result.daysLeftToAppeal : 'Past due'}</b>
            </div>
          )}

          <ConsultingTools facts={facts} analysis={result} jurisdiction={jurisdiction} onFindSpecialist={onFindSpecialist} />

          <div className="actions">
            <button type="button" className="text-link" onClick={onFindSpecialist}>
              Find a claims specialist for this case
            </button>
            <button type="button" className="btn primary" onClick={onGenerateComplaint} disabled={loading}>
              {loading ? 'Drafting…' : 'Prepare my complaint'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
