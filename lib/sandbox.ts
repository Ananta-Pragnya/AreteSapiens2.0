import vm from 'node:vm';
import { AnalysisResult, CaseFacts, PreClaimFacts, PreClaimResult, Regulation } from './types';

const FORBIDDEN_PATTERNS = [
  /require\s*\(/,
  /import\s+/,
  /process\s*\./,
  /globalThis/,
  /fetch\s*\(/,
  /XMLHttpRequest/,
  /child_process/,
  /\bfs\s*\./,
  /__proto__/,
  /constructor\s*\[/,
];

export class UnsafeGeneratedCodeError extends Error {}

function assertSafe(code: string) {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(code)) {
      throw new UnsafeGeneratedCodeError(
        `Generated code contains a disallowed pattern: ${pattern}`
      );
    }
  }
}

// Runs the generated analyzeCase(facts, regulation) function in an isolated
// vm context. No fs/process/network globals, timeout-bounded. Good enough to
// run LLM-written logic safely, not meant to hold up against adversarial code.
export function runGeneratedAnalysis(
  code: string,
  facts: CaseFacts,
  regulation: Regulation
): AnalysisResult {
  assertSafe(code);

  const context = vm.createContext({
    FACTS: facts,
    REGULATION: regulation,
    Math,
    JSON,
    Date,
    console: { log: () => {} },
    result: undefined,
  });

  const wrapped = `${code}\nresult = analyzeCase(FACTS, REGULATION);`;

  const script = new vm.Script(wrapped, { filename: 'generated-check.js' });
  script.runInContext(context, { timeout: 2000 });

  const result = (context as { result?: unknown }).result;
  if (!result || typeof result !== 'object') {
    throw new Error('Generated analyzeCase() did not return a result object.');
  }
  return result as AnalysisResult;
}

export function runGeneratedPreClaimCheck(
  code: string,
  facts: PreClaimFacts,
  regulation: Regulation
): PreClaimResult {
  assertSafe(code);
  const context = vm.createContext({
    FACTS: facts,
    REGULATION: regulation,
    Math,
    JSON,
    Date,
    console: { log: () => {} },
    result: undefined,
  });
  const script = new vm.Script(`${code}\nresult = checkPreClaim(FACTS, REGULATION);`, {
    filename: 'generated-preclaim-check.js',
  });
  script.runInContext(context, { timeout: 2000 });
  const result = (context as { result?: unknown }).result;
  if (!result || typeof result !== 'object') {
    throw new Error('Generated checkPreClaim() did not return a result object.');
  }
  return result as PreClaimResult;
}
