'use client';

import { SavedCase } from '@/lib/savedCases';

type Props = {
  cases: SavedCase[];
  onNewReview: () => void;
  onOpenCase: (id: string) => void;
};

export default function Dashboard({ cases, onNewReview, onOpenCase }: Props) {
  return (
    <div>
      <header className="nav">
        <button type="button" className="brand link" onClick={onNewReview}>
          Claim Guardian<b>.</b>
        </button>
        <div className="nav-actions">
          <button type="button" className="link" onClick={onNewReview}>
            New review
          </button>
        </div>
      </header>
      <main className="dashboard">
        <div className="kicker">Your cases</div>
        <h1>Keep the next step clear.</h1>
        <p>Cases are saved in this browser for your reference.</p>

        {cases.length === 0 ? (
          <div className="muted">No saved cases yet. Finish a review and save it here.</div>
        ) : (
          <div className="case-list">
            {cases.map((c) => {
              const daysLeft = c.analysis.daysLeftToAppeal;
              const attention = daysLeft !== null && daysLeft <= 14;
              const statusLabel =
                daysLeft === null
                  ? 'No appeal deadline on record'
                  : daysLeft >= 0
                  ? `${daysLeft} days left`
                  : 'Appeal window passed';
              return (
                <div className="case-row" key={c.id}>
                  <div>
                    <b>{c.facts.insurerName || 'Unnamed insurer'}</b>
                    <span>
                      CASE {c.id} &middot; Saved {c.savedAt.slice(0, 10)}
                    </span>
                  </div>
                  <span className={`status ${attention ? 'attention' : ''}`}>{statusLabel}</span>
                  <button type="button" className="btn small" onClick={() => onOpenCase(c.id)}>
                    Review
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
