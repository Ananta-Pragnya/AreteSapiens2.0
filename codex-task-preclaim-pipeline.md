You're working in the Claim Guardian repo at the project root. This app checks whether an insurance
claim denial violated the law, for the US (California), the EU (Germany), and India. It just went
through a significant architecture change and this task ports part of that change to the one flow
that hasn't caught up yet.

Read these files first, in this order, they show you the exact pattern to mirror:

1. lib/regulations.ts, note the `statutoryExcerpts` field on `Regulation`, real quoted statute text
   with a label and source URL, not paraphrase.
2. lib/retrieval.ts, a small BM25 retriever (via @langchain/core's BaseRetriever, no embeddings model,
   no API key, fully local and instant) that chunks a regulation's statutoryExcerpts with
   @langchain/textsplitters and returns the most relevant real passages for a text query.
3. lib/pipeline.ts, a LangGraph (@langchain/langgraph) StateGraph called `runAnalysisPipeline` with
   three nodes: generateCheck (calls lib/ai.ts's runCodeGeneration), executeCheck (runs the generated
   code in lib/sandbox.ts's vm sandbox), and groundCitations (for every failed check, calls
   retrieveContext from lib/retrieval.ts and rewrites that check's citation to quote the actual
   retrieved statute text instead of just a flat sourceLabel string). There's a conditional edge that
   loops back to generateCheck once if execution fails and the code came from GPT, capped at two
   attempts.
4. app/api/analyze/route.ts, now just calls runAnalysisPipeline and returns the result, replacing what
   used to be a manual retry loop written directly in the route.
5. lib/ai.ts, specifically runPolicyExtraction: this already reads the uploaded photo with real local
   OCR (lib/ocr.ts, tesseract.js) and real regex extraction (lib/structuredExtract.ts) whenever there's
   no OpenAI key, instead of returning canned fixture data. This part of Stage 1 is already done,
   don't touch it.

What's NOT done yet: app/api/preclaim-analyze/route.ts still has the old-style manual retry loop
(calls runPreClaimCheck from lib/ai.ts, then runGeneratedPreClaimCheck from lib/sandbox.ts, with a
hand-written attempt counter), and its checklist citations are still flat sourceLabel strings, never
grounded against the real statute text.

Your job: build `runPreClaimPipeline` in lib/pipeline.ts as a second StateGraph, structured exactly
like `runAnalysisPipeline`, but for the pre-claim checklist instead of the denial-violation checks:

1. State: facts (PreClaimFacts), regulation (Regulation), code (string), source ('gpt' | 'local'),
   attempts (number), result (PreClaimResult | null).
2. Node generateCheck: calls runPreClaimCheck(facts, regulation) from lib/ai.ts.
3. Node executeCheck: calls runGeneratedPreClaimCheck(code, facts, regulation) from lib/sandbox.ts,
   catching failure the same way runAnalysisPipeline's executeCheck does (return { result: null } on
   throw, never let the node itself throw).
4. Conditional edge after executeCheck: same routing logic as the analysis graph, loop back to
   generateCheck if result is null and attempts < 2 and source is 'gpt', otherwise go to
   groundCitations.
5. Node groundCitations: for every item in result.checklist where satisfied === false, call
   retrieveContext with a query built from that item's label and detail, same as the analysis graph
   does, and if there's a match, rewrite that item's citation to quote the excerpt text and its label,
   same format string as the analysis graph uses. Leave satisfied === true or 'unknown' items alone.
6. Export `runPreClaimPipeline(facts, regulation)` returning { code, source, result }, throwing if
   result ends up null, exactly mirroring runAnalysisPipeline's shape.

Then update app/api/preclaim-analyze/route.ts to call runPreClaimPipeline instead of the manual retry
loop, the same way app/api/analyze/route.ts was simplified. It should end up just as short as
app/api/analyze/route.ts is now.

Constraints:
- Match the existing code style: no em dashes anywhere, sparse plain comments only where something
  is genuinely non-obvious, no JSDoc blocks.
- Don't touch runAnalysisPipeline, lib/ai.ts, lib/retrieval.ts, or anything under components/, this is
  scoped to lib/pipeline.ts and app/api/preclaim-analyze/route.ts only.
- When done, run `npx tsc --noEmit` and `npm run build` and fix anything that fails before considering
  this done.
- Do not add a README or other docs unless asked.
