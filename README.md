# AreteSapiens 2.0

AreteSapiens 2.0 is an AI-powered document intelligence suite designed to help people understand legal notices and insurance decisions through transparent, evidence-based analysis. Instead of relying solely on a language model's interpretation, every conclusion is backed by deterministic validation, cited regulations, and reasoning that users can inspect for themselves.

Originally built during an OpenAI Build Week hackathon, the project has evolved into two complementary applications--**Vaakil** and **Claim Guardian** --that solve different problems while sharing the same engineering philosophy: AI should assist judgment, not replace it.

---

# Vaakil

Vaakil helps users review legal and regulatory documents such as debt collection notices, eviction notices, court summons, employment termination letters, consumer notices, and other forms of legal correspondence. Users can upload a document or paste its contents to receive a structured review that identifies the document type and jurisdiction, highlights potentially threatening or non-compliant language directly from the source, explains its implications in plain language, and generates an appropriate draft response.

Document classification is performed using deterministic keyword matching, avoiding unnecessary model calls during the identification stage. Detailed analysis is powered by Groq's `gpt-oss-20b`, with an automatic retry using `gpt-oss-120b` whenever structured output validation fails. If readable text is unavailable or both model calls fail, the application seamlessly falls back to a deterministic rule-based engine, ensuring every document still receives a meaningful analysis.

Vaakil also includes a lightweight financial health module that tracks recurring bills, subscriptions, warranties, and grocery prices over time. Historical records are monitored for anomalies, while Groq provides concise, plain-language explanations of detected changes.

User data is stored in MongoDB whenever a database is configured and reachable. If MongoDB is unavailable, the application automatically falls back to an in-memory datastore, allowing the platform to remain fully functional without any additional infrastructure.

---

# Claim Guardian

Claim Guardian is designed for insurance policyholders who receive claim denials, delay notices, or reduced payouts. It reviews both insurance policies and insurer correspondence, identifies the regulations that govern the claim, highlights potential policy or statutory violations, and generates well-structured appeal drafts.

The default processing pipeline requires **no API key**. Documents are processed using local OCR through Tesseract, followed by regex and heuristic extraction. Every legal citation is retrieved through a custom-built BM25 retrieval engine using statutory text collected from official government sources rather than language-model-generated summaries.

Compliance checks are executed through a LangGraph pipeline that generates Python validation scripts, executes them inside a sandboxed virtual machine, and retries generation once if execution fails. Rather than presenting users with an opaque verdict, the generated validation code is displayed alongside the analysis, making every compliance decision transparent and inspectable.

An OpenAI API key is entirely optional. When provided, it improves document extraction, narrative understanding, and appeal drafting, while the underlying compliance checks continue to operate independently of the language model.

Claim Guardian also includes a **Pre-Claim Review** mode that evaluates an insurance policy before a claim is submitted, helping users identify potential issues that could lead to avoidable claim denials.

---

# The Bench

Both products provide access to **The Bench** after an analysis is completed.

The Bench is a searchable directory of sample legal professionals that can be filtered by jurisdiction, specialization, and pricing tier. Every profile is fictional seed data created solely for demonstration purposes and is clearly labelled as such throughout the interface. Request submissions are stored only within the application's local development environment, and no payment processing is implemented anywhere in the platform.

---

# Design Philosophy

AreteSapiens is built around transparency rather than blind automation.

Every finding is traceable to a specific cited rule, every compliance decision can be inspected, and every deterministic check is exposed rather than hidden behind a confidence score. When the system cannot confidently verify a claim, it explicitly communicates that uncertainty instead of fabricating an answer.

Pursuit-likelihood estimates are calculated using a visible scoring formula rather than proprietary model confidence, and the platform never claims certifications, verifications, or legal authority that it does not possess.

---

# Architecture

The platform consists of two independent services presented through a single user interface.

- **Frontend:** Next.js
- **Vaakil Backend:** Flask (Python)
- **Claim Guardian Engine:** Next.js server with LangGraph-based workflows
- **Database:** MongoDB (optional)
- **Fallback Storage:** In-memory datastore
- **Primary LLM (Vaakil):** Groq `gpt-oss-20b` with automatic escalation to `gpt-oss-120b`
- **Optional LLM (Claim Guardian):** OpenAI GPT
- **OCR:** Tesseract
- **Retrieval Engine:** Custom BM25 implementation
- **Execution Environment:** Sandboxed Python virtual machine

Both products are served from a single application at `http://localhost:3000`. Requests destined for Vaakil are transparently proxied to the Flask backend, allowing the entire suite to be launched and accessed through a single entry point.

---

# Prerequisites

- Node.js 18+
- Python 3.11+

---

# Installation

Install the project dependencies:

```bash
npm install
pip install -r requirements.txt
```

Copy the environment templates:

```bash
cp .env.example .env
cp .env.local.example .env.local
```

### `.env` (Flask / Vaakil)

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Recommended | Enables AI-powered legal analysis and financial explanations. Without it, Vaakil automatically falls back to deterministic rule-based analysis. |
| `MONGODB_URI` | Optional | Enables persistent storage. If omitted or unreachable, the application automatically uses in-memory storage. |
| `FLASK_SECRET_KEY` | Optional | Any string for local development. |
| `PORT` | Keep `8080` | Expected by the development launcher. |

### `.env.local` (Next.js / Claim Guardian)

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Optional | Enhances extraction, narrative understanding, and appeal drafting. The default compliance engine functions without it. |
| `ARETE_SAPIENS_ORIGIN` | Keep `http://127.0.0.1:8080` | Address of the Flask backend used by the frontend proxy. |

---

# Running the Project

Start the complete application:

```bash
npm run dev
```

The launcher starts both services simultaneously, exposes the application on **http://localhost:3000**, proxies requests between services, and shuts everything down cleanly with `Ctrl+C`.

---

# Usage

### Vaakil

Navigate to `/vaakil` or launch it from the Hub.

Paste legal notice text or upload a document to receive document classification, jurisdiction detection, rule-based analysis, AI-assisted explanations, and a draft response. Image-only uploads fall back to deterministic analysis because Groq does not currently provide vision support.

### Claim Guardian

Upload an insurance document, choose the appropriate jurisdiction, and follow the guided review workflow. Once Tesseract has been downloaded during the first run, OCR processing works entirely offline.

### The Bench

Accessible after completing an analysis in either application.

---

# Deployment

Deployment configuration is already included for both development and production environments.

- Flask includes configuration for Docker, Fly.io, and Render.
- The Next.js frontend deploys directly to Vercel.

When deploying, simply configure `ARETE_SAPIENS_ORIGIN` to point to the hosted Flask backend. The rewrite-based proxy requires no further modification.

---

# Notes

- The first OCR operation downloads the Tesseract language model (approximately a few megabytes). Subsequent OCR runs are fully offline.
- Production mode can be started using:

```bash
npm run build
npm start
```

- Unit tests for the TypeScript compliance engine can be executed with:

```bash
npm test
```

---

## Disclaimer

AreteSapiens is an educational and assistive platform. It does not provide legal advice, financial advice, or professional representation. Users should consult qualified professionals before making decisions based on the information generated by the application.
