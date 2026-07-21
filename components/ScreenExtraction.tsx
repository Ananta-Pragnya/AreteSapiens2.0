'use client';

import { CaseFacts } from '@/lib/types';
import SourceBadge from './SourceBadge';

type Props = {
  facts: CaseFacts;
  onChange: (facts: CaseFacts) => void;
  onConfirm: () => void;
  loading: boolean;
  error: string | null;
  extractionSource: 'gpt' | 'local' | null;
  narrativeSource: 'gpt' | 'local' | null;
  jurisdictionWarning: string | null;
};

function Row({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="extract-row">
      <span className="extract-key">{label}</span>
      <span className="extract-value">
        {multiline ? (
          <textarea value={value} onChange={(e) => onChange(e.target.value)} />
        ) : (
          <input type="text" value={value} onChange={(e) => onChange(e.target.value)} />
        )}
      </span>
    </div>
  );
}

export default function ScreenExtraction({
  facts,
  onChange,
  onConfirm,
  loading,
  error,
  extractionSource,
  narrativeSource,
  jurisdictionWarning,
}: Props) {
  function set<K extends keyof CaseFacts>(key: K, value: CaseFacts[K]) {
    onChange({ ...facts, [key]: value });
  }

  return (
    <div>
      <div className="kicker">Confirm the record</div>
      <h1>Check what we read.</h1>
      <p className="lede">
        Please correct anything that does not match your document. The review uses this record.
        <SourceBadge source={extractionSource} liveLabel="GPT vision" />
      </p>

      {jurisdictionWarning && <div className="error-block">{jurisdictionWarning}</div>}

      <div className="extract">
        <Row label="Insurer" value={facts.insurerName} onChange={(v) => set('insurerName', v)} />
        <Row label="Policy number" value={facts.policyNumber} onChange={(v) => set('policyNumber', v)} />
        <Row
          label="Claim filed"
          value={facts.claimFiledDate ?? ''}
          onChange={(v) => set('claimFiledDate', v || null)}
        />
        <Row
          label="Decision received"
          value={facts.deniedDate ?? ''}
          onChange={(v) => set('deniedDate', v || null)}
        />
        <Row
          label="Reason given"
          value={facts.denialReasonVerbatim}
          onChange={(v) => set('denialReasonVerbatim', v)}
          multiline
        />
        <Row
          label="Clause or code"
          value={facts.citedClauseOrCode}
          onChange={(v) => set('citedClauseOrCode', v)}
        />
      </div>

      <label className="field-label">
        Your account
        <SourceBadge source={narrativeSource} liveLabel="GPT text" />
      </label>
      <div className="extract">
        <Row
          label="What happened"
          value={facts.whatHappened}
          onChange={(v) => set('whatHappened', v)}
          multiline
        />
        <Row
          label="What was claimed"
          value={facts.whatWasClaimed}
          onChange={(v) => set('whatWasClaimed', v)}
          multiline
        />
        <Row
          label="What was expected"
          value={facts.whatWasExpected}
          onChange={(v) => set('whatWasExpected', v)}
          multiline
        />
        <div className="extract-row">
          <span className="extract-key">Docs requested first?</span>
          <span className="extract-value">
            <select
              value={facts.requiredDocsRequestedBeforeDenial}
              onChange={(e) =>
                set('requiredDocsRequestedBeforeDenial', e.target.value as CaseFacts['requiredDocsRequestedBeforeDenial'])
              }
              style={{ border: 'none', background: 'transparent', font: 'inherit' }}
            >
              <option value="unknown">Unknown</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </span>
        </div>
      </div>

      {error && <div className="error-block">{error}</div>}

      <div className="actions">
        <span />
        <button type="button" className="btn primary" onClick={onConfirm} disabled={loading}>
          {loading ? 'Reviewing…' : 'This is correct, continue'}
        </button>
      </div>
    </div>
  );
}
