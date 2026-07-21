'use client';

type Props = {
  onBackToHub: () => void;
  onStartReview: () => void;
  onViewDashboard: () => void;
};

export default function Landing({ onBackToHub, onStartReview, onViewDashboard }: Props) {
  return (
    <div>
      <header className="nav">
        <button type="button" className="brand link" onClick={() => window.scrollTo(0, 0)}>
          Claim Guardian<b>.</b>
        </button>
        <div className="nav-actions">
          <button type="button" className="link hide-mobile" onClick={onBackToHub}>
            ← All tools
          </button>
          <button
            type="button"
            className="link hide-mobile"
            onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
          >
            How it works
          </button>
          <button type="button" className="link hide-mobile" onClick={onViewDashboard}>
            My cases
          </button>
          <button type="button" className="btn small" onClick={onStartReview}>
            Start a review
          </button>
        </div>
      </header>

      <main className="landing-hero">
        <div className="hero">
          <div className="eyebrow">Insurance claim review</div>
          <h1>Make sure the reason for denial holds up.</h1>
          <p>
            Claim Guardian turns your documents into a clear case record, checks the handling
            against the rules that apply, and shows you the evidence behind every finding.
          </p>
          <div className="hero-actions">
            <button type="button" className="btn primary" onClick={onStartReview}>
              Review my claim
            </button>
            <button
              type="button"
              className="text-link"
              onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
            >
              See how it works
            </button>
          </div>
          <div className="proof">
            <div>
              <strong>Evidence first</strong>
              <span>Your documents stay central to every review.</span>
            </div>
            <div>
              <strong>Rules cited</strong>
              <span>Findings point back to the applicable regulation.</span>
            </div>
            <div>
              <strong>Built to inspect</strong>
              <span>Open the logic behind the result.</span>
            </div>
          </div>
        </div>

        <aside className="case-preview">
          <div className="preview-head">
            <span>CASE REVIEW</span>
            <span>CG-04182</span>
          </div>
          <div className="preview-title">Meridian Health</div>
          <div className="preview-sub">Claim decision received June 26 2026</div>
          <div className="finding">
            <div className="mark">!</div>
            <div>
              <strong>Response may have exceeded the allowed window</strong>
              <small>CAL. CODE REGS. TIT. 10, § 2695.7</small>
            </div>
          </div>
          <div className="finding">
            <div className="mark">!</div>
            <div>
              <strong>Denial may not identify the policy basis</strong>
              <small>CLAIM DECISION REQUIREMENTS</small>
            </div>
          </div>
          <div className="deadline">
            <span>Time left to appeal</span>
            <b>12 days</b>
          </div>
        </aside>
      </main>

      <section className="section" id="how">
        <div className="kicker">A clear, four-step review</div>
        <h2>One case at a time. Nothing hidden behind a verdict.</h2>
        <div className="steps">
          <div className="step">
            <div className="n">01 / COLLECT</div>
            <h3>Bring what you have</h3>
            <p>A photo, a voice note, or your own account is enough to begin.</p>
          </div>
          <div className="step">
            <div className="n">02 / VERIFY</div>
            <h3>Correct the record</h3>
            <p>Confirm each extracted date, reason, and policy reference before checking starts.</p>
          </div>
          <div className="step">
            <div className="n">03 / REVIEW</div>
            <h3>See what applies</h3>
            <p>Review plain-language findings and the actual rules that support them.</p>
          </div>
        </div>
      </section>

      <div className="trust">
        <b>Private by design</b>
        <p>
          Your documents are used to prepare this case review. Claim Guardian does not replace
          independent legal advice or submit anything without your approval.
        </p>
      </div>

      <footer className="footer">
        <div className="footer-inner">
          <span>Claim Guardian is an information tool, not a law firm.</span>
          <span>Privacy &nbsp; Terms &nbsp; Contact</span>
        </div>
      </footer>
    </div>
  );
}
