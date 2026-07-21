'use client';

import { useState } from 'react';
import { AnalysisResult, Regulation } from '@/lib/types';
import SourceBadge from './SourceBadge';

type Props = {
  letter: string;
  regulation: Regulation;
  result: AnalysisResult;
  insurerName: string;
  onFindSpecialist: () => void;
  onRestart: () => void;
  onSave: () => void;
  saved: boolean;
  letterSource: 'gpt' | 'local' | null;
};

export default function ScreenOutput({
  letter,
  regulation,
  result,
  insurerName,
  onFindSpecialist,
  onRestart,
  onSave,
  saved,
  letterSource,
}: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleDownloadPdf() {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const marginX = 56;
    const maxWidth = 500;
    const lines = doc.splitTextToSize(letter, maxWidth);
    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    let y = 72;
    const pageHeight = doc.internal.pageSize.getHeight();
    for (const line of lines) {
      if (y > pageHeight - 72) {
        doc.addPage();
        y = 72;
      }
      doc.text(line, marginX, y);
      y += 16;
    }
    doc.save('complaint-letter.pdf');
  }

  const daysLeft = result.daysLeftToAppeal;

  return (
    <div>
      <div className="kicker">Ready to file</div>
      <h1>Your complaint is ready to review.</h1>
      <p className="lede">
        Download the letter or copy it for your records. Read it carefully before you send it
        anywhere.
      </p>

      <div className="extract">
        <div className="extract-row">
          <span className="extract-key">Filed against</span>
          <span className="extract-value">{insurerName || 'unknown insurer'}</span>
        </div>
        <div className="extract-row">
          <span className="extract-key">Grounds</span>
          <span className="extract-value">
            {result.violationCount} issue{result.violationCount === 1 ? '' : 's'} found
          </span>
        </div>
        <div className="extract-row">
          <span className="extract-key">Appeal time left</span>
          <span className="extract-value">
            {daysLeft === null ? 'unknown' : daysLeft >= 0 ? `${daysLeft} days` : 'past due'}
          </span>
        </div>
      </div>

      <label className="field-label">
        Complaint letter
        <SourceBadge source={letterSource} liveLabel="GPT drafted" />
      </label>
      <div className="letter-doc">
        <div className="letter-doc-head">
          <span className="cite">Draft, {regulation.ombudsmanName}</span>
        </div>
        <div className="letter-doc-body">{letter}</div>
      </div>

      <div className="actions">
        <button type="button" className="back" onClick={onRestart}>
          Start a new case
        </button>
        <button type="button" className="text-link" onClick={onFindSpecialist}>
          Find a claims specialist for this case
        </button>
        <div style={{ display: 'flex', gap: 12 }}>
          <button type="button" className="btn" onClick={handleCopy}>
            {copied ? 'Copied' : 'Copy text'}
          </button>
          <button type="button" className="btn" onClick={onSave}>
            {saved ? 'Saved' : 'Save to my cases'}
          </button>
          <button type="button" className="btn primary" onClick={handleDownloadPdf}>
            Download complaint
          </button>
        </div>
      </div>

      <div className="footer" style={{ marginTop: 40, padding: '20px 0' }}>
        Claim Guardian is not legal advice. Verify the current statutory text and consult a
        licensed professional before filing.
      </div>
    </div>
  );
}
