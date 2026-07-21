You are working in a Next.js 15 (App Router, TypeScript) project called Claim Guardian, at the repo root. Read these files first before changing anything, they define every convention you must follow:

- lib/types.ts (all shared types)
- lib/regulations.ts (hardcoded regulation dataset per jurisdiction: US_CA, EU_DE, IN)
- lib/openai.ts (real OpenAI calls: vision extraction, narrative parsing, code generation, letter drafting, each with a strict system prompt and a JSON/code-fence parsing helper)
- lib/ai.ts (wraps every openai.ts call: tries the live call, falls back to lib/demo.ts only on MissingApiKeyError, returns {data, source: 'live'|'demo'})
- lib/demo.ts (fixture data and template functions used when there's no API key, so the app still runs end to end with zero API spend)
- lib/sandbox.ts (executes LLM-generated JS in a locked-down vm context)
- app/api/*/route.ts (thin route handlers calling lib/ai.ts)
- components/Screen*.tsx and app/page.tsx (the 4-screen client-side state machine, design system in app/globals.css: off-white background, hairline borders, serif headers, mono for data/code, one amber signal color reserved for violations only, no shadows, no spinners, no chat UI)

Your job: implement Stage 1, "Pre-Claim", which is currently just a disabled radio option in components/ScreenInput.tsx. Stage 2 (Rejected/Delayed) is the fully working reference implementation, mirror its shape closely.

What Stage 1 does: a user who has NOT filed a claim yet uploads a photo of their policy document (or types/records a description of their situation) and gets back a pre-claim checklist: does this situation plausibly meet the policy's coverage criteria, what documentation will the insurer likely require, and what statutory response deadline will apply once they file. This is meant to stop claims from being denied on a technicality before they're even submitted.

Scope of work:

1. lib/types.ts: add `PolicyExtractionResult` (insurerName, policyNumber, coverageSummary, exclusionsListedVerbatim: string[], requiredDocumentationListed: string[], rawText) and `PreClaimResult` (checklist: {id, label, satisfied: boolean | 'unknown', detail, citation?}[], likelyRequiredDocs: string[], statutoryDecisionDeadlineDays: number, notes: string).

2. lib/openai.ts: add `extractPolicyDocument(imageDataUrl)` (vision call, same pattern as extractDenialLetter, but reads a policy document instead of a denial letter) and `generatePreClaimChecklist(facts, regulation)` (codegen call, same pattern as generateValidationScript, but the generated function is `checkPreClaim(facts, regulation)` returning a PreClaimResult instead of AnalysisResult). Keep the same style: strict system prompt, temperature 0, extractJson/extractCode helpers, no markdown in the reply.

3. lib/demo.ts: add a demo fixture policy extraction per jurisdiction (US_CA, EU_DE, IN) and a hand-written `DEMO_PRECLAIM_CHECK_CODE` string that is a real, working `checkPreClaim` function, same spirit as the existing DEMO_CHECK_CODE, it must actually execute in lib/sandbox.ts and produce a sensible result from whatever facts are passed in.

4. lib/ai.ts: add `runPolicyExtraction` and `runPreClaimCheck` wrappers following the exact same try-live-then-fall-back-to-demo pattern as the existing functions.

5. New API routes: app/api/policy-extract/route.ts (photo in, PolicyExtractionResult + source out) and app/api/preclaim-analyze/route.ts (facts + jurisdiction in, checklist result + generated code + source out, reusing runGeneratedAnalysis's sandbox pattern generalized to run any analyze-shaped function, or add a small sibling in lib/sandbox.ts if the function name needs to differ, don't hack the existing one).

6. UI: enable the "Pre-claim" radio in components/ScreenInput.tsx (remove the "Roadmap, not computed" note and the disabled-unless-rejected logic for this one path). Add a new components/ScreenPreClaimResult.tsx that mirrors the visual style of ScreenAnalysis.tsx (checklist rows with the same check-row/check-mark CSS classes, expandable generated code block, SourceBadge usage) but shows the pre-claim checklist and likely-required-docs list instead of pass/fail violations, no "Generate Complaint" button since there's no denial yet, instead an "I'm ready to file" button that just returns to the input screen.

7. app/page.tsx: extend the screen state machine so choosing "Pre-claim" and submitting routes through policy-extract + narrative-parse (reuse the existing narrative endpoint and handling) into a preclaim-analyze call and then ScreenPreClaimResult, in parallel with the existing rejected-path flow, don't break or rename anything in the Stage 2 path.

Constraints:
- Match the existing code style exactly: no em dashes anywhere (comments, strings, UI copy), sparse human comments only where something is non-obvious, no JSDoc blocks, plain functional TypeScript React, no new dependencies.
- Every new OpenAI call must go through the live-then-demo-fallback pattern, never throw MissingApiKeyError up to the API route.
- Don't touch the Stage 2 (Rejected/Delayed) files beyond what's strictly needed to wire the shared narrative step and the screen router.
- When done, run `npx tsc --noEmit` and `npm run build` and fix anything that fails before considering the task complete.
- Do not add a README or other docs unless asked.
