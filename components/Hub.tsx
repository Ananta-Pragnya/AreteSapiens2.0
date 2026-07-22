'use client';

import { useState } from 'react';

type Props = {
  onOpenClaimGuardian: () => void;
};

type Subview = 'home' | 'vaakil' | 'claimguardian';

function tickPoint(deg: number, radius: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: 100 + radius * Math.sin(rad), y: 100 - radius * Math.cos(rad) };
}

function Seal() {
  const majorDegrees = Array.from({ length: 12 }, (_, i) => i * 30);
  const minorDegrees = Array.from({ length: 60 }, (_, i) => i * 6).filter((deg) => deg % 30 !== 0);

  return (
    <svg className="hub-seal" viewBox="0 0 200 200">
      <circle className="hub-seal-glow" cx="100" cy="100" r="90" />
      <circle className="hub-seal-ring" cx="100" cy="100" r="64" />
      <g className="hub-seal-dial">
        {minorDegrees.map((deg) => {
          const outer = tickPoint(deg, 92);
          const inner = tickPoint(deg, 87);
          return (
            <line
              key={`minor-${deg}`}
              className="hub-seal-tick"
              x1={outer.x}
              y1={outer.y}
              x2={inner.x}
              y2={inner.y}
            />
          );
        })}
        {majorDegrees.map((deg) => {
          const outer = tickPoint(deg, 92);
          const inner = tickPoint(deg, 80);
          return (
            <line
              key={`major-${deg}`}
              className="hub-seal-tick-major"
              x1={outer.x}
              y1={outer.y}
              x2={inner.x}
              y2={inner.y}
            />
          );
        })}
        <circle className="hub-seal-ring draw" cx="100" cy="100" r="92" />
      </g>
      <path id="hubSealPath" d="M 100,100 m -50,0 a 50,50 0 1,1 100,0 a 50,50 0 1,1 -100,0" fill="none" />
      <text className="hub-seal-word">
        <textPath href="#hubSealPath" startOffset="2%">
          ARETE SAPIENS · PERSONAL LIFE OS · ARETE SAPIENS ·{' '}
        </textPath>
      </text>
      <text x="100" y="96" textAnchor="middle" className="hub-seal-center" fontWeight="600" fontSize="22" fill="#ECE7DD">
        AS
      </text>
      <text x="100" y="116" textAnchor="middle" fontFamily="var(--font-plex-mono)" fontSize="8" letterSpacing="2" fill="#6be3a3">
        EST. INDEX I
      </text>
    </svg>
  );
}

function BrandMark() {
  return (
    <svg className="hub-brand-mark" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="14.5" fill="none" stroke="#6be3a3" strokeWidth="1.2" />
      <circle cx="16" cy="16" r="10.5" fill="none" stroke="#5c5850" strokeWidth="0.8" />
      <text x="16" y="20" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="600" fontSize="11" fill="#ECE7DD">
        AS
      </text>
    </svg>
  );
}

export default function Hub({ onOpenClaimGuardian }: Props) {
  const [subview, setSubview] = useState<Subview>('home');
  // Vaakil is proxied by Next, so users never need to leave the main app origin.
  const areteSapiensAppUrl = '/vaakil';

  return (
    <div className="hub-shell">
      {subview === 'home' && (
        <div key="home" className="hub-view">
          <header className="hub-topbar">
            <button type="button" className="hub-brand" onClick={() => setSubview('home')}>
              <BrandMark />
              <div className="hub-brand-name">Arete Sapiens</div>
              <div className="hub-brand-tag">Personal Life OS</div>
            </button>
            <nav className="hub-top-nav">
              <a onClick={() => setSubview('vaakil')}>Vaakil</a>
              <a onClick={() => setSubview('claimguardian')}>Claim Guardian</a>
            </nav>
          </header>

          <main className="hub-hero">
            <div>
              <div className="hub-eyebrow">Two certified instruments</div>
              <h1>Built for the moment someone with more power than you sends something in writing.</h1>
              <p className="hub-sub">
                A legal notice. A denied claim. <em>Vaakil</em> and <em>Claim Guardian</em> read
                what&apos;s actually written, check it against the law that governs it, and hand you
                back the response, not just an explanation.
              </p>
              <div className="hub-hero-proof">
                Every citation traces to the regulation itself, <strong>you can check our work.</strong>
              </div>
            </div>
            <div className="hub-seal-wrap">
              <Seal />
            </div>
          </main>

          <section className="hub-registry">
            <div className="hub-reg-label">
              <span>The registry</span>
              <span>02 instruments</span>
            </div>

            <div className="hub-reg-grid">
              <div
                className="hub-reg-row hub-mod-a"
                onClick={() => setSubview('vaakil')}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSubview('vaakil')}
              >
                <div className="hub-reg-num">
                  <span className="hub-accent-dot" />
                  No. 01
                </div>
                <div className="hub-reg-title-block">
                  <h3>Vaakil</h3>
                  <p>For when the letter comes from a landlord, a collector, or a court.</p>
                </div>
                <div className="hub-reg-tags">
                  <span className="hub-reg-tag">Legal notices</span>
                  <span className="hub-reg-tag">Bills</span>
                  <span className="hub-reg-tag">Subscriptions</span>
                  <span className="hub-reg-tag">Warranties</span>
                  <span className="hub-reg-tag">Groceries</span>
                </div>
                <div className="hub-reg-arrow">→</div>
              </div>

              <div
                className="hub-reg-row hub-mod-b"
                onClick={() => setSubview('claimguardian')}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSubview('claimguardian')}
              >
                <div className="hub-reg-num">
                  <span className="hub-accent-dot" />
                  No. 02
                </div>
                <div className="hub-reg-title-block">
                  <h3>Claim Guardian</h3>
                  <p>For when the letter comes from your insurer, saying no.</p>
                </div>
                <div className="hub-reg-tags">
                  <span className="hub-reg-tag">Pre-claim check</span>
                  <span className="hub-reg-tag">Denial review</span>
                  <span className="hub-reg-tag">Deadline watch</span>
                  <span className="hub-reg-tag">Appeal autopilot</span>
                </div>
                <div className="hub-reg-arrow">→</div>
              </div>
            </div>
          </section>

          <p className="hub-close-line">
            Neither instrument argues on feeling. Both cite the line, the clause, the statute,{' '}
            <strong>and show you the check that ran.</strong>
          </p>

          <footer className="hub-foot">
            <span>Not a law firm. Not affiliated with any insurer, landlord, or collection agency.</span>
            <span>Index updated continuously</span>
          </footer>
        </div>
      )}

      {subview === 'vaakil' && (
        <div key="vaakil" className="hub-view">
          <div className="hub-prod-topbar">
            <div className="hub-back-pill" onClick={() => setSubview('home')}>
              ← Arete Sapiens
            </div>
            <nav className="hub-top-nav">
              <a onClick={() => setSubview('claimguardian')}>No. 02: Claim Guardian</a>
            </nav>
          </div>

          <div className="hub-prod-hero">
            <div>
              <div className="hub-badge hub-mod-a">
                <span className="hub-dot" />
                No. 01 &middot; Free, no signup
              </div>
              <h1>Vaakil reads your legal notice and tells you your rights.</h1>
              <p className="hub-sub">
                Photograph a debt collection notice, eviction letter, or court summons. Vaakil
                identifies the jurisdiction, flags illegal threats quoted directly from the
                document, and drafts your response.
              </p>
              <ul className="hub-check-list hub-mod-a">
                <li>
                  <span className="hub-tick">01</span>Works across India, the US, UK, Australia,
                  Canada, and Nigeria
                </li>
                <li>
                  <span className="hub-tick">02</span>Quotes the exact illegal language back to
                  you, not a generic warning
                </li>
                <li>
                  <span className="hub-tick">03</span>Drafts a ready-to-send response letter
                </li>
              </ul>
            </div>
            <div className="hub-prod-side">
              <a className="hub-prod-cta hub-primary hub-mod-a" href={areteSapiensAppUrl}>
                Read my notice
              </a>
              <a className="hub-prod-cta hub-ghost" href="/vaakil">
                See how it works
              </a>
              <div className="hub-prod-note">
                No account needed for your first read. Sign up only to save the case.
              </div>
            </div>
          </div>

          <div className="hub-also-section">
            <div className="hub-also-label">Also inside, once you&apos;re in</div>
            <div className="hub-also-grid">
              <div className="hub-also-card">
                <h4>Bills</h4>
                <p>Catches spikes and explains why, in plain language.</p>
              </div>
              <div className="hub-also-card">
                <h4>Subscriptions</h4>
                <p>Flags creeping price rises before renewal.</p>
              </div>
              <div className="hub-also-card">
                <h4>Warranties</h4>
                <p>Tracks expiry dates and what to do before they lapse.</p>
              </div>
              <div className="hub-also-card">
                <h4>Groceries</h4>
                <p>Watches prices against broader inflation trends.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {subview === 'claimguardian' && (
        <div key="claimguardian" className="hub-view">
          <div className="hub-prod-topbar">
            <div className="hub-back-pill" onClick={() => setSubview('home')}>
              ← Arete Sapiens
            </div>
            <nav className="hub-top-nav">
              <a onClick={() => setSubview('vaakil')}>No. 01: Vaakil</a>
            </nav>
          </div>

          <div className="hub-prod-hero">
            <div>
              <div className="hub-badge hub-mod-b">
                <span className="hub-dot" />
                No. 02 &middot; Free, no signup
              </div>
              <h1>Claim Guardian reads your denial letter and tells you if it&apos;s legal.</h1>
              <p className="hub-sub">
                Photograph a denial letter, delayed claim notice, or a payout that came up short.
                Claim Guardian identifies the regulation that applies, flags violations quoted
                directly from your policy, and drafts your appeal.
              </p>
              <ul className="hub-check-list hub-mod-b">
                <li>
                  <span className="hub-tick">01</span>Works across US, India (IRDAI), and EU
                  insurance regulation
                </li>
                <li>
                  <span className="hub-tick">02</span>Cites the exact statute violated, not a
                  generic explanation
                </li>
                <li>
                  <span className="hub-tick">03</span>Drafts a ready-to-send appeal, and keeps
                  watching the deadline after
                </li>
              </ul>
            </div>
            <div className="hub-prod-side">
              <button type="button" className="hub-prod-cta hub-primary hub-mod-b" onClick={onOpenClaimGuardian}>
                Check my claim
              </button>
              <button type="button" className="hub-prod-cta hub-ghost" onClick={onOpenClaimGuardian}>
                See how it works
              </button>
              <div className="hub-prod-note">
                No account needed for your first check. Cases save to this browser so Guardian can
                keep tracking them.
              </div>
            </div>
          </div>

          <div className="hub-also-section">
            <div className="hub-also-label">Also inside, once you&apos;re in</div>
            <div className="hub-also-grid">
              <div className="hub-also-card">
                <h4>Pre-claim check</h4>
                <p>Reviews your policy before you file, so it isn&apos;t denied on a technicality.</p>
              </div>
              <div className="hub-also-card">
                <h4>Deadline watch</h4>
                <p>Tracks statutory response windows automatically, no reminders needed.</p>
              </div>
              <div className="hub-also-card">
                <h4>Appeal autopilot</h4>
                <p>Roadmap: pre-drafts your next escalation before the deadline passes.</p>
              </div>
              <div className="hub-also-card">
                <h4>Insurer analytics</h4>
                <p>Roadmap: shows how this insurer&apos;s response times compare over time.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
