import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import { AnalysisResult, CaseFacts, PreClaimFacts, PreClaimResult, Regulation } from './types';
import { runCodeGeneration, runPreClaimCheck } from './ai';
import { runGeneratedAnalysis, runGeneratedPreClaimCheck } from './sandbox';
import { retrieveContext } from './retrieval';

// The analysis step as a small LangGraph pipeline: generate the check,
// run it, and ground every violation's citation in the actual retrieved
// regulation text instead of just a flat label. If the generated code
// fails to execute and it came from GPT, we loop back and ask again
// (capped at two attempts). The local engine's code doesn't need a
// retry, it's the same deterministic function every time.

const AnalysisState = Annotation.Root({
  facts: Annotation<CaseFacts>,
  regulation: Annotation<Regulation>,
  code: Annotation<string>,
  source: Annotation<'gpt' | 'local'>,
  attempts: Annotation<number>,
  result: Annotation<AnalysisResult | null>,
});

type AnalysisStateType = typeof AnalysisState.State;

async function generateCheckNode(state: AnalysisStateType) {
  const { data, source } = await runCodeGeneration(state.facts, state.regulation);
  return { code: data, source, attempts: (state.attempts ?? 0) + 1 };
}

async function executeCheckNode(state: AnalysisStateType) {
  try {
    const result = runGeneratedAnalysis(state.code, state.facts, state.regulation);
    return { result };
  } catch {
    return { result: null };
  }
}

function routeAfterExecute(state: AnalysisStateType) {
  if (state.result) return 'groundCitations';
  if (state.attempts < 2 && state.source === 'gpt') return 'generateCheck';
  return 'groundCitations';
}

async function groundCitationsNode(state: AnalysisStateType) {
  if (!state.result) return {};
  const checks = await Promise.all(
    state.result.checks.map(async (check) => {
      if (check.passed) return check;
      const excerpts = await retrieveContext(`${check.label} ${check.detail}`, state.regulation);
      if (!excerpts.length) return check;
      return { ...check, citation: `"${excerpts[0].text}" (${excerpts[0].label})` };
    })
  );
  return { result: { ...state.result, checks } };
}

const analysisGraph = new StateGraph(AnalysisState)
  .addNode('generateCheck', generateCheckNode)
  .addNode('executeCheck', executeCheckNode)
  .addNode('groundCitations', groundCitationsNode)
  .addEdge(START, 'generateCheck')
  .addEdge('generateCheck', 'executeCheck')
  .addConditionalEdges('executeCheck', routeAfterExecute, {
    generateCheck: 'generateCheck',
    groundCitations: 'groundCitations',
  })
  .addEdge('groundCitations', END)
  .compile();

export async function runAnalysisPipeline(facts: CaseFacts, regulation: Regulation) {
  const final = await analysisGraph.invoke({
    facts,
    regulation,
    code: '',
    source: 'local',
    attempts: 0,
    result: null,
  });

  if (!final.result) {
    throw new Error('Generated validation script failed to execute.');
  }

  return { code: final.code, source: final.source, result: final.result };
}

const PreClaimState = Annotation.Root({
  facts: Annotation<PreClaimFacts>,
  regulation: Annotation<Regulation>,
  code: Annotation<string>,
  source: Annotation<'gpt' | 'local'>,
  attempts: Annotation<number>,
  result: Annotation<PreClaimResult | null>,
});

type PreClaimStateType = typeof PreClaimState.State;

async function generatePreClaimCheckNode(state: PreClaimStateType) {
  const { data, source } = await runPreClaimCheck(state.facts, state.regulation);
  return { code: data, source, attempts: (state.attempts ?? 0) + 1 };
}

async function executePreClaimCheckNode(state: PreClaimStateType) {
  try {
    const result = runGeneratedPreClaimCheck(state.code, state.facts, state.regulation);
    return { result };
  } catch {
    return { result: null };
  }
}

function routeAfterPreClaimExecute(state: PreClaimStateType) {
  if (state.result) return 'groundCitations';
  if (state.attempts < 2 && state.source === 'gpt') return 'generateCheck';
  return 'groundCitations';
}

async function groundPreClaimCitationsNode(state: PreClaimStateType) {
  if (!state.result) return {};
  const checklist = await Promise.all(
    state.result.checklist.map(async (check) => {
      if (check.satisfied !== false) return check;
      const excerpts = await retrieveContext(`${check.label} ${check.detail}`, state.regulation);
      if (!excerpts.length) return check;
      return { ...check, citation: `"${excerpts[0].text}" (${excerpts[0].label})` };
    })
  );
  return { result: { ...state.result, checklist } };
}

const preClaimGraph = new StateGraph(PreClaimState)
  .addNode('generateCheck', generatePreClaimCheckNode)
  .addNode('executeCheck', executePreClaimCheckNode)
  .addNode('groundCitations', groundPreClaimCitationsNode)
  .addEdge(START, 'generateCheck')
  .addEdge('generateCheck', 'executeCheck')
  .addConditionalEdges('executeCheck', routeAfterPreClaimExecute, {
    generateCheck: 'generateCheck',
    groundCitations: 'groundCitations',
  })
  .addEdge('groundCitations', END)
  .compile();

export async function runPreClaimPipeline(facts: PreClaimFacts, regulation: Regulation) {
  const final = await preClaimGraph.invoke({
    facts,
    regulation,
    code: '',
    source: 'local',
    attempts: 0,
    result: null,
  });

  if (!final.result) {
    throw new Error('Generated pre-claim check failed to execute.');
  }

  return { code: final.code, source: final.source, result: final.result };
}
