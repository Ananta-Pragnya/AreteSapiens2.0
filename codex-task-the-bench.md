You're adding one new feature, "The Bench", to a two-product hackathon submission: Vaakil (a Flask
app at the project root, legal notice analysis) and Claim Guardian (a Next.js app at the same
project root, insurance denial review). Both already exist and work, this task adds a directory of
professionals a user can filter by budget and request a consultation from, for each product.

READ FIRST, both products already established these conventions, follow them exactly:
- Flask side: mongo_client.py (data access, falls back to local_store.py's in-memory store when
  MongoDB is unreachable, which it currently is), app.py (routes), templates/index.html (the tab-based
  single page UI, dark navy/gold palette, CSS vars --ink/--surface/--gold/--mint/--patina etc.),
  groq_client.py (how a Groq call is structured: try, catch, deterministic fallback string).
- Next.js side: lib/types.ts, lib/savedCases.ts (the pattern for a localStorage-backed feature, no
  backend database, this is the pattern to copy for consultation requests), components/*.tsx (the
  design system in app/globals.css: .extract/.extract-row, .option, .btn/.btn.primary, .result-row,
  .field-label, warm paper/pine/mint/rose palette), app/page.tsx (the view state machine).

CRITICAL HONESTY CONSTRAINT, do not deviate from this: every professional in this directory is
fictional, seeded placeholder data for a demo, the same category as the "Meridian Health" placeholder
insurer already used in the Hub component. Do not invent real-sounding bar registration numbers, real
law firm names, real physical addresses, or any claim of verification/certification. Add one visible,
permanent label on the Bench screen itself, something like "Sample directory for this demo, not a
live marketplace" in the section kicker, not just in a footnote. Submitting the request form does not
contact anyone, it stores the request and shows a confirmation, do not simulate a live call, a payment
flow, or a "professional is typing" style fake-liveness cue.

DATA MODEL, use this shape in both stacks:

Professional {
  id: string
  name: string                 // fictional placeholder, e.g. "Adv. Priya Menon"
  title: string                // e.g. "Debt Recovery Advocate" or "Insurance Claims Attorney"
  jurisdictions: string[]      // Vaakil: subset of IN/US/GB/AU/CA/NG. Claim Guardian: subset of US_CA/EU_DE/IN
  specialties: string[]        // Vaakil: debt_collection/eviction_notice/court_summons/employment_termination/consumer_notice
                                // Claim Guardian: denial_review/bad_faith/pre_claim/appeal/underpayment
  tier: "free_consult" | "budget" | "standard" | "premium"
  tier_label: string            // e.g. "Free first call", "Rs.1,500-3,000/session", "Rs.5,000+/session"
                                 // (or $ amounts for the US/EU seed rows in Claim Guardian's version)
  years_experience: number
  rating: number                 // 1.0-5.0, one decimal
  languages: string[]
  bio: string                    // one or two sentences, plain language
  response_time_hours: number
}

ConsultationRequest {
  id: string
  professional_id: string
  case_context: string          // pre-filled from the analysis the user already ran, editable
  contact_name: string
  contact_email: string
  preferred_tier: string
  preferred_time: string         // free text, e.g. "Weekday evenings" or a date string, no real calendar integration
  created_at: string
  status: "requested"            // the only status this demo needs
}

SEED DATA, write about 6 Professional rows for Vaakil (India-heavy since that's Vaakil's main
jurisdiction, plus one or two for GB/US/AU each) and about 6 for Claim Guardian (spread across
US_CA, EU_DE, IN), covering a spread of tiers and specialties so the filters actually do something
visible. Vary tier_label currency by jurisdiction (Rs. for IN, $ for US, EUR for EU_DE).

═══════════════════════════════════════════════════════════════════════════
PART 1: VAAKIL (Flask, project root)
═══════════════════════════════════════════════════════════════════════════

1. New file `advocates.py` at the project root: a module-level list of seeded Professional dicts
   (matching the shape above) plus a small filter function `find_advocates(jurisdiction=None,
   specialty=None, tier=None)` that filters the in-memory list. This does not need MongoDB, it's
   static seed data, same spirit as jurisdictions/*.json.

2. In `mongo_client.py`, add `save_consultation_request(data)` and `get_consultation_requests(user_id)`
   following the exact pattern of `save_alert`/`get_alerts` already in that file, storing into a
   `consultation_requests` collection (works automatically through the existing local_store.py
   fallback, no new plumbing needed there).

3. In `app.py`, add routes:
   - `GET /api/advocates` with optional `jurisdiction`, `specialty`, `tier` query params, calls
     `advocates.find_advocates(...)`, returns the filtered list as JSON.
   - `GET /api/advocates/<id>` returns one professional or 404.
   - `POST /api/consultation-requests`, body has professional_id/case_context/contact_name/
     contact_email/preferred_tier/preferred_time, validates required fields the same way
     `api_add_warranty` etc. already do (400 with a message if missing), calls
     `save_consultation_request`, returns `{"status": "ok", "id": ...}`.
   These do not need `require_premium()`, the Bench should be reachable without a trial, same as Vaakil
   itself is free.

4. UI: add a new tab to `templates/index.html` following the exact pattern of the existing
   `vaakil-tab`/`nav-tab` and `#vaakil-page`/`.page` structure (grep for `nav-tab` and `class="page"`
   to see the convention). Call it "The Bench". Contents:
   - A section kicker reading something like "Sample directory for this demo, filter by what you can
     spend" using the existing `.eyebrow`-equivalent styling already in that file.
   - Filter controls: jurisdiction select, specialty select, tier select (reuse existing `<select>`/
     button styling already present elsewhere in the file, don't invent a new control style).
   - A card grid of professionals (name, title, jurisdiction tags, tier badge, rating, response time,
     bio, a "Request a consultation" button), styled with the existing card conventions already used
     for e.g. warranty/subscription rows in that same template.
   - Clicking "Request a consultation" opens a simple form (case_context textarea pre-filled if the
     user has an active Vaakil analysis in the current session, contact_name, contact_email,
     preferred_time), submits to `POST /api/consultation-requests`, then shows a confirmation state:
     "Request saved. [Name] typically responds within [X] hours." plus the existing disclaimer styling.
   - Add a "Find an advocate for this" link/button on the Vaakil results view (where
     `#vaakil-results` is rendered) that switches to the Bench tab with the specialty pre-filtered to
     the current document's doc_type, and case_context pre-filled from `analysis.summary`.

═══════════════════════════════════════════════════════════════════════════
PART 2: CLAIM GUARDIAN (Next.js, project root, same conventions as Hub/Landing/Dashboard)
═══════════════════════════════════════════════════════════════════════════

1. `lib/types.ts`: add `Professional` and `ConsultationRequest` types matching the shape above
   (jurisdictions use the existing `JurisdictionId` union already defined there).

2. `lib/advocates.ts`: a seeded `const PROFESSIONALS: Professional[]` array (the ~6 rows described
   above) and a `findProfessionals(filters)` pure function. No backend needed, this is static data,
   same spirit as `lib/regulations.ts`.

3. `lib/consultationRequests.ts`: copy the exact pattern of `lib/savedCases.ts` (localStorage-backed,
   `listConsultationRequests()`, `saveConsultationRequest(entry)`), same key-prefix convention
   (`claim-guardian:consultation-requests`).

4. `components/Bench.tsx`: a new screen, styled with the EXISTING classes already in app/globals.css,
   do not add a new palette. Use `.field-label`/`.option`-style filter controls, `.extract`/
   `.extract-row` or `.result-row` for the professional cards, `.btn`/`.btn.primary` for actions,
   the same `.kicker`/`h1`/`.lede` heading pattern every other screen already uses. Include the
   required "Sample directory for this demo" kicker line. Request form and confirmation state follow
   the same shape as the Vaakil side: pre-fill case_context from whatever violation/citation text is
   available from the current case's analysis (the `AnalysisResult.checks` the user already has after
   running a review), contact fields, preferred_time, submit writes to localStorage via
   `saveConsultationRequest`, then show a confirmation with the chosen professional's name and
   response_time_hours.

5. Wire it into `app/page.tsx`: add `'bench'` to the `View` union, a way to reach it from
   `ScreenAnalysis.tsx` and `ScreenOutput.tsx` (a text-link button, "Find a claims specialist for
   this case", following the `.text-link` convention already used elsewhere in those files) that
   carries the current jurisdiction and a specialty inferred from the violated checks (e.g. if the
   timeliness check failed, pre-filter specialty to `appeal`, if the reason-category check failed,
   pre-filter to `denial_review`). Add a back-out path to wherever the user came from, matching how
   `onBack`/`AppFrame` already works for the rest of the flow.

CONSTRAINTS FOR BOTH PARTS:
- No em dashes anywhere in new code, copy, or comments, this codebase has been kept consistently
  free of them throughout.
- No new dependencies, no new color palette, no new fonts, reuse exactly what's already defined.
- No real payment collection, no fake "call in progress" or typing-indicator theater, no claim of
  verification/certification for any professional.
- When done: for the Flask side, run `python -m py_compile app.py advocates.py mongo_client.py` and
  actually boot the app and hit the new routes with curl to confirm real 200s, the same way the rest
  of this project has been verified. For the Next.js side, run `npx tsc --noEmit` and `npm run build`
  and confirm both pass clean before considering this done.
