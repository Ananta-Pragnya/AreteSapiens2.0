# AreteSapiens 2.0

This started as a project for an OpenAI build-week hackathon: one weekend, one prompt to build
something real with GPT and Codex. It grew into an umbrella suite of two tools built on the same
idea, that the paperwork meant to intimidate you is usually checkable, if something actually reads
it and holds it up against the real rule that governs it.

**Vaakil** came first. **Claim Guardian** followed, built the same way, for a different letter.

## Vaakil

For when the letter comes from a landlord, a debt collector, or a court.

Photograph or paste a legal notice, debt collection, eviction, court summons, employment
termination, consumer notice, and Vaakil identifies the jurisdiction, quotes the exact
threatening or non-compliant language straight out of the document, and drafts a response.

- Jurisdiction and document-type detection is instant keyword matching, no model call needed to
  know what you're looking at.
- Real analysis runs on Groq's `gpt-oss-20b`, escalating once to `gpt-oss-120b` if the first
  response fails to come back as valid structured output. Underneath both sits a fully
  deterministic, rule-based analysis that never returns nothing, used whenever there's no text to
  read (Groq has no vision model, so a bare photo needs this path) or if both model calls fail.
- Vaakil also carries a small household "financial health" suite: bills, subscriptions,
  warranties, and grocery prices, tracked over time with anomaly-based alerts and the same
  Groq-backed plain-language explanations.
- Data persists to MongoDB when it's configured and reachable, an an
  in-memory store when it isn't, so the whole thing still runs wia
  Groq key.

## Claim Guardian

For when the letter comes from your insurer, saying no.

Photograph a denial letter, a delay notice, or a payout that came up short, and Claim Guardian
identifies the regulation that actually applies (US-California, Elags
violations quoted from your own policy and letter, and drafts an appeal.

- The default engine needs no API key at all. Real local OCR (Tesseract) plus regex and heuristic
  extraction reads the document, and a from-scratch BM25 retrieveds
  every citation in actual statutory text pulled from official sources, not a paraphrase of it.
- A LangGraph pipeline generates the compliance-check script for es
  it in a sandboxed VM, retrying once if a model-generated script fails to run. The generated code
  is shown on screen, not hidden behind a verdict.
- An OpenAI key is entirely optional. It upgrades extraction, narrative parsing, and drafting
  quality, it never replaces the underlying checks, which run the.
- A Pre-Claim mode reviews your policy before you file, so it isn't denied on a technicality to
  begin with.

## The Bench

Reachable from either product once a review is done, "Find a spec."

A labeled sample directory of professionals, filterable by jurisd
tier. Every profile is fictional seed data built for this demo, clearly marked as such on the
screen itself. Submitting a request only saves it on your own devne,
and there is no real payment flow anywhere in it.

## The shared philosophy

Neither tool argues from a vibe. Every finding traces to a specific cited rule, and the logic that
produced it is something you can actually open and read, not a bl.
Where the system genuinely doesn't know something, it says so instead of guessing, Claim Guardian's
"Ask Guardian" Q&A will answer "I can't confirm that from the recation.
Pursuit-likelihood estimates are a visible, simple formula, not a hidden model. Nothing claims a
certification or verification it doesn't actually have.

## How it's reachable

Both products run from one address: **http://localhost:3000**. Vaat
same origin, proxied through from a separate Flask service running behind the scenes, so there's
only ever one link to open, one command to start.

## Prerequisites

- Node.js 18+
- Python 3.11+

## Setup

```
npm install
pip install -r requirements.txt
```

Copy the two environment templates and fill them in:

```
cp .env.example .env
cp .env.local.example .env.local
```

**`.env` (Flask / Vaakil side):**

| Variable | Required? | Notes |
|---|---|---|
| `GROQ_API_KEY` | Recommended | Powers Vaakil's real document analysis and the financial-health explanations. Without it, everything still runs on the
deterministic rule-based fallback instead of real model output. |
| `MONGODB_URI` | Optional | If missing or unreachable, the app automatically falls back to an in-memory store, everything still works, data just doesn't
persist across restarts. |
| `FLASK_SECRET_KEY` | Optional | Any string works locally. |
| `PORT` | Leave as `8080` | The dev script expects Flask on this

**`.env.local` (Next.js / Claim Guardian side):**

| Variable | Required? | Notes |
|---|---|---|
| `OPENAI_API_KEY` | Optional | The default engine (real OCR, regrieval) needs no key at all. Adding one upgrades extraction,narrative parsing, and drafting to GPT. |
| `ARETE_SAPIENS_ORIGIN` | Leave as `http://127.0.0.1:8080` | Wheand its API calls to. |

## Run it

```
npm run dev
```

One command starts both services (`scripts/run-suite.mjs`), Flask
port 3000, and stops both cleanly on Ctrl+C.

Open **http://localhost:3000**, that's the Hub, with both products one click away.

## Trying it out

- **Vaakil**: pick it from the Hub, or go straight to `/vaakil`, and paste in some notice-like text
  (a debt collection or eviction notice reads best) for the richerk
  but fall back to a generic rule-based read, since no vision model is wired up on the Groq side.
- **Claim Guardian**: upload a photo of any letter-like document, pick
  a jurisdiction, and walk through the review. Works fully offline once Tesseract's OCR model is
  cached.
- **The Bench**: reachable from either product's results screen once you've run a review.

## Deployment

Deployment configuration already exists for the Flask side (`Dockerfile`, `fly.toml` for Fly.io,
`render.yaml` for Render). The Next.js side deploys cleanly to Ve
`ARETE_SAPIENS_ORIGIN` environment variable at wherever the Flask service ends up hosted, the
rewrite-based proxy in `next.config.mjs` needs nothing else chang

## Notes

- The very first photo analysis in Claim Guardian downloads Tesseew
  MB), so that one run needs internet, everything after is fully offline.
- `npm run build && npm start` runs the same two-service setup in
- `npm test` runs the TypeScript test suite for the core check-generation logic.
- Nothing in this project is legal or financial advice.
