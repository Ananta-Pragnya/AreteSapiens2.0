<<<<<<< HEAD
# AreteSapiens2.0
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
| `GROQ_API_KEY` | Recommended | Powers Vaakil's real document analysis and the financial-health explanations. Without it, everything still runs on a deterministic rule-based fallback instead of real model output. |
| `MONGODB_URI` | Optional | If missing or unreachable, the app automatically falls back to an in-memory store, everything still works, data just doesn't persist across restarts. |
| `FLASK_SECRET_KEY` | Optional | Any string works locally. |
| `PORT` | Leave as `8080` | The dev script expects Flask on this port. |

**`.env.local` (Next.js / Claim Guardian side):**

| Variable | Required? | Notes |
|---|---|---|
| `OPENAI_API_KEY` | Optional | Claim Guardian's default engine (real OCR + regex extraction + regulation retrieval) needs no key at all. Adding one upgrades extraction, narrative parsing, and drafting to GPT. |
| `ARETE_SAPIENS_ORIGIN` | Leave as `http://127.0.0.1:8080` | Where Next.js proxies `/vaakil` and its API calls to. |

## Run it

```
npm run dev
```

This one command starts both services (`scripts/run-suite.mjs`): Flask on port 8080 and Next.js
on port 3000, and stops both cleanly on Ctrl+C.

Open **http://localhost:3000**, that's the Hub, with both products one click away.

## Trying it out

- **Claim Guardian**: pick it from the Hub, upload a photo of any letter-like document (or type a
  narrative instead), pick a jurisdiction, and walk through the review. Works fully offline once
  Tesseract's OCR model is cached.
- **Vaakil**: pick Arete Sapiens from the Hub, or go straight to `/vaakil`, and paste in some
  notice-like text (a debt collection or eviction notice reads best) for the richest analysis.
  Photo uploads work but fall back to a generic rule-based read, since no vision model is wired up
  on the Groq side.
- **The Bench**: reachable from either product's results screen ("Find a specialist/advocate for
  this case").

## Deployment

Deployment configuration already exists for the Flask side (`Dockerfile`, `fly.toml` for Fly.io,
`render.yaml` for Render). The Next.js side deploys cleanly to Vercel; point its
`ARETE_SAPIENS_ORIGIN` environment variable at wherever the Flask service ends up hosted, the
rewrite-based proxy in `next.config.mjs` needs nothing else changed.

## Notes

- The very first photo analysis in Claim Guardian downloads Tesseract's English OCR model
  (a few MB), so that one run needs internet, everything after is fully offline.
- `npm run build && npm start` runs the same two-service setup in production mode.
- `npm test` runs the TypeScript test suite for the core check-generation logic.
- Nothing in this project is legal or financial advice.
=======
# AreteSapiens2.0
>>>>>>> 2809c1c9b25c0315e888e906a1666de4ef35516e
