'use client';

import { useState } from 'react';
import { PreClaimResult, Regulation } from '@/lib/types';
import SourceBadge from './SourceBadge';

type Props = {
  progressLines: string[];
  code: string | null;
  result: PreClaimResult | null;
  regulation: Regulation;
  error: string | null;
  codeSource: 'gpt' | 'local' | null;
  onReadyToFile: () => void;
  jurisdictionWarning: string | null;
};

export default function ScreenPreClaimResult({
  progressLines,
  code,
  result,
  regulation,
  error,
  codeSource,
  onReadyToFile,
  jurisdictionWarning,
}: Props) {
  const [showCode, setShowCode] = useState(false);

  return (
    <div>
      <div className="kicker">Before you file</div>
      <h1>What to prepare.</h1>
      <p className="lede">
        Filing without meeting the policy&apos;s own conditions is the most common way a valid
        claim gets denied on a technicality. Here&apos;s what to line up first.
      </p>

      {!result &&
        progressLines.map((line, i) => (
          <div key={i} className="cite" style={{ marginBottom: 4 }}>
            {line}
          </div>
        ))}

      {error && <div className="error-block">{error}</div>}
      {jurisdictionWarning && <div className="error-block">{jurisdictionWarning}</div>}

      {result && (
        <>
          <div className="result-intro">
            <b>Coverage checklist</b>
            <span>Compared against your policy and what you told us.</span>
          </div>

          {result.checklist.map((item) => (
            <div className={`result-row ${item.satisfied !== false ? 'ok' : ''}`} key={item.id}>
              <strong>{item.label}</strong>
              <div className="cite">
                {item.satisfied === true ? 'Met' : item.satisfied === false ? 'Not met' : 'Unclear'}
                {' · '}
                {item.detail}
                {item.satisfied === false && item.citation ? ` · ${item.citation}` : ''}
              </div>
            </div>
          ))}

          <label className="field-label">Likely required documents</label>
          {result.likelyRequiredDocs.length ? (
            <div className="extract">
              {result.likelyRequiredDocs.map((doc) => (
                <div className="extract-row" key={doc}>
                  <span className="extract-value" style={{ gridColumn: '1 / -1' }}>
                    {doc}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="muted">
              No document list was identified from what you provided. Ask the insurer for its
              claim checklist directly before filing.
            </div>
          )}

          <div className="notice">
            <span>Decision deadline once you file, in full</span>
            <b>{result.statutoryDecisionDeadlineDays}d</b>
          </div>
          <div className="cite" style={{ marginTop: 8 }}>{result.notes}</div>

          <button type="button" className="text-link" style={{ marginTop: 22 }} onClick={() => setShowCode((s) => !s)}>
            {showCode ? 'Hide the check that ran' : 'Read the check that ran'}
          </button>
          <SourceBadge source={codeSource} liveLabel="generated per case" />
          {showCode && code && <pre className="code open">{code}</pre>}

          <div className="cite" style={{ marginTop: 16 }}>Source: {regulation.sourceLabel}</div>

          <div className="actions">
            <span />
            <button type="button" className="btn primary" onClick={onReadyToFile}>
              I&apos;m ready to file
            </button>
          </div>
        </>
      )}
    </div>
  );
}
