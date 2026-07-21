'use client';

import { ReactNode } from 'react';

type Step = 'input' | 'confirm' | 'analysis' | 'result';

type Props = {
  step: Step;
  onExit: () => void;
  onBack?: () => void;
  largeText: boolean;
  onLargeTextChange: (v: boolean) => void;
  children: ReactNode;
};

const STEP_NUMBER: Record<Step, number> = {
  input: 1,
  confirm: 2,
  analysis: 3,
  result: 4,
};

export default function AppFrame({ step, onExit, onBack, largeText, onLargeTextChange, children }: Props) {
  const n = STEP_NUMBER[step];

  return (
    <div className={largeText ? 'large-text' : ''}>
      <header className="nav">
        <button type="button" className="brand link" onClick={onExit}>
          Claim Guardian<b>.</b>
        </button>
        <div className="nav-actions">
          <span className="hide-mobile">Need help? Call (800) 555-0142</span>
          <button
            type="button"
            className="link"
            onClick={() => onLargeTextChange(!largeText)}
            aria-label="Toggle larger text"
          >
            {largeText ? 'A' : 'A+'}
          </button>
          <button type="button" className="link" onClick={onExit}>
            Exit
          </button>
        </div>
      </header>
      <div className="flow-progress">
        <div className="flow-progress-inner">
          <div className="track">
            <div className="fill" style={{ width: `${n * 25}%` }} />
          </div>
          <div className="step-label">
            <span>Step {n} of 4</span>
            <span>Case review</span>
          </div>
        </div>
      </div>
      <main className="flow">
        {onBack && (
          <button type="button" className="back" style={{ marginBottom: 18 }} onClick={onBack}>
            Back
          </button>
        )}
        {children}
      </main>
    </div>
  );
}
