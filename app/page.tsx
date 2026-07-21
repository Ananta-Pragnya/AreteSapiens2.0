'use client';

import { useEffect, useState } from 'react';
import ScreenInput, { ClaimStage } from '@/components/ScreenInput';
import ScreenExtraction from '@/components/ScreenExtraction';
import ScreenAnalysis from '@/components/ScreenAnalysis';
import ScreenOutput from '@/components/ScreenOutput';
import ScreenPreClaimResult from '@/components/ScreenPreClaimResult';
import AppFrame from '@/components/AppFrame';
import Hub from '@/components/Hub';
import Landing from '@/components/Landing';
import Dashboard from '@/components/Dashboard';
import Bench from '@/components/Bench';
import { REGULATIONS } from '@/lib/regulations';
import { listSavedCases, saveCase, getSavedCase, SavedCase } from '@/lib/savedCases';
import {
  AnalysisResult,
  CaseFacts,
  ExtractionResult,
  JurisdictionId,
  NarrativeFacts,
  PolicyExtractionResult,
  PreClaimFacts,
  PreClaimResult,
} from '@/lib/types';

type Screen = 'input' | 'confirm' | 'analysis' | 'output' | 'preclaim';
type View = 'hub' | 'landing' | 'flow' | 'dashboard' | 'bench';

const EMPTY_FACTS: CaseFacts = {
  insurerName: '',
  policyNumber: '',
  claimFiledDate: null,
  deniedDate: null,
  todayDate: new Date().toISOString().slice(0, 10),
  denialReasonVerbatim: '',
  citedClauseOrCode: '',
  whatHappened: '',
  whatWasClaimed: '',
  whatWasExpected: '',
  requiredDocsRequestedBeforeDenial: 'unknown',
};

function makeCaseNumber() {
  return `CG-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return data.error || fallback;
  } catch {
    return fallback;
  }
}

export default function Home() {
  const [caseNumber, setCaseNumber] = useState(makeCaseNumber);
  const [largeText, setLargeText] = useState(false);
  const [view, setView] = useState<View>('hub');
  const [screen, setScreen] = useState<Screen>('input');
  const [jurisdiction, setJurisdiction] = useState<JurisdictionId>('US_CA');
  const [claimStage, setClaimStage] = useState<ClaimStage>('rejected');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [narrativeText, setNarrativeText] = useState('');

  const [facts, setFacts] = useState<CaseFacts>(EMPTY_FACTS);
  const [progressLines, setProgressLines] = useState<string[]>([]);
  const [code, setCode] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [preClaimResult, setPreClaimResult] = useState<PreClaimResult | null>(null);
  const [letter, setLetter] = useState<string | null>(null);
  const [caseSaved, setCaseSaved] = useState(false);
  const [savedCases, setSavedCases] = useState<SavedCase[]>([]);
  const [benchOrigin, setBenchOrigin] = useState<Screen>('analysis');
  const [benchSpecialty, setBenchSpecialty] = useState<string | undefined>();

  const [extractionSource, setExtractionSource] = useState<'gpt' | 'local' | null>(null);
  const [narrativeSource, setNarrativeSource] = useState<'gpt' | 'local' | null>(null);
  const [analysisSource, setAnalysisSource] = useState<'gpt' | 'local' | null>(null);
  const [complaintSource, setComplaintSource] = useState<'gpt' | 'local' | null>(null);

  const [intakeLoading, setIntakeLoading] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [complaintLoading, setComplaintLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [jurisdictionWarning, setJurisdictionWarning] = useState<string | null>(null);
  const [restoredCase, setRestoredCase] = useState(false);

  const regulation = REGULATIONS[jurisdiction];

  useEffect(() => {
    const saved = window.localStorage.getItem('claim-guardian-case');
    if (!saved) {
      setRestoredCase(true);
      return;
    }
    try {
      const data = JSON.parse(saved) as {
        view?: View;
        screen?: Screen;
        caseNumber?: string;
        jurisdiction?: JurisdictionId;
        claimStage?: ClaimStage;
        narrativeText?: string;
        facts?: CaseFacts;
        progressLines?: string[];
        code?: string | null;
        analysis?: AnalysisResult | null;
        preClaimResult?: PreClaimResult | null;
        letter?: string | null;
        jurisdictionWarning?: string | null;
      };
      // The hub is always the entry point on a fresh visit, never restored past it.
      // Everything else still restores so an in-progress case resumes correctly
      // once the user actually chooses Claim Guardian from the hub.
      if (data.screen) setScreen(data.screen);
      if (data.caseNumber) setCaseNumber(data.caseNumber);
      if (data.jurisdiction) setJurisdiction(data.jurisdiction);
      if (data.claimStage) setClaimStage(data.claimStage);
      if (data.narrativeText) setNarrativeText(data.narrativeText);
      if (data.facts) setFacts(data.facts);
      if (data.progressLines) setProgressLines(data.progressLines);
      if (data.code) setCode(data.code);
      if (data.analysis) setAnalysis(data.analysis);
      if (data.preClaimResult) setPreClaimResult(data.preClaimResult);
      if (data.letter) setLetter(data.letter);
      if (data.jurisdictionWarning) setJurisdictionWarning(data.jurisdictionWarning);
    } catch {
      window.localStorage.removeItem('claim-guardian-case');
    } finally {
      setRestoredCase(true);
    }
    setSavedCases(listSavedCases());
  }, []);

  useEffect(() => {
    if (!restoredCase) return;
    window.localStorage.setItem(
      'claim-guardian-case',
      JSON.stringify({
        view,
        screen,
        caseNumber,
        jurisdiction,
        claimStage,
        narrativeText,
        facts,
        progressLines,
        code,
        analysis,
        preClaimResult,
        letter,
        jurisdictionWarning,
      })
    );
  }, [
    analysis,
    caseNumber,
    claimStage,
    code,
    facts,
    jurisdiction,
    jurisdictionWarning,
    letter,
    narrativeText,
    preClaimResult,
    progressLines,
    restoredCase,
    screen,
    view,
  ]);

  async function handleSubmitIntake() {
    setError(null);
    setIntakeLoading(true);
    try {
      if (claimStage === 'pre-claim') {
        await handlePreClaimIntake();
        return;
      }
      let extraction: (ExtractionResult & { source?: 'gpt' | 'local' }) | null = null;
      if (photoFile) {
        const form = new FormData();
        form.append('photo', photoFile);
        form.append('jurisdiction', jurisdiction);
        const res = await fetch('/api/extract', { method: 'POST', body: form });
        if (!res.ok) throw new Error(await readError(res, 'Photo extraction failed.'));
        extraction = await res.json();
        setExtractionSource(extraction?.source ?? null);
        setJurisdictionWarning(extraction?.jurisdictionWarning ?? null);
      }

      let narrativeFacts: (NarrativeFacts & { source?: 'gpt' | 'local' }) | null = null;
      if (narrativeText.trim()) {
        const res = await fetch('/api/narrative', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: narrativeText }),
        });
        if (!res.ok) throw new Error(await readError(res, 'Narrative parsing failed.'));
        narrativeFacts = await res.json();
        setNarrativeSource(narrativeFacts?.source ?? null);
      }

      setFacts({
        insurerName: extraction?.insurerName ?? '',
        policyNumber: extraction?.policyNumber ?? '',
        claimFiledDate: extraction?.claimFiledDate ?? null,
        deniedDate: extraction?.deniedDate ?? null,
        todayDate: new Date().toISOString().slice(0, 10),
        denialReasonVerbatim: extraction?.denialReasonVerbatim ?? '',
        citedClauseOrCode: extraction?.citedClauseOrCode ?? '',
        whatHappened: narrativeFacts?.whatHappened ?? '',
        whatWasClaimed: narrativeFacts?.whatWasClaimed ?? '',
        whatWasExpected: narrativeFacts?.whatWasExpected ?? '',
        requiredDocsRequestedBeforeDenial: narrativeFacts?.requiredDocsRequestedBeforeDenial ?? 'unknown',
      });
      setScreen('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong reading your case.');
    } finally {
      setIntakeLoading(false);
    }
  }

  async function handlePreClaimIntake() {
    setAnalysisError(null);
    setCode(null);
    setPreClaimResult(null);
    setProgressLines(['Reading policy document...']);
    setScreen('preclaim');
    try {
      let extraction: (PolicyExtractionResult & { source?: 'gpt' | 'local' }) | null = null;
      if (photoFile) {
        const form = new FormData();
        form.append('photo', photoFile);
        form.append('jurisdiction', jurisdiction);
        const res = await fetch('/api/policy-extract', { method: 'POST', body: form });
        if (!res.ok) throw new Error(await readError(res, 'Policy extraction failed.'));
        extraction = await res.json();
        setExtractionSource(extraction?.source ?? null);
        setJurisdictionWarning(extraction?.jurisdictionWarning ?? null);
      }

      let narrativeFacts: (NarrativeFacts & { source?: 'gpt' | 'local' }) | null = null;
      if (narrativeText.trim()) {
        const res = await fetch('/api/narrative', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: narrativeText }),
        });
        if (!res.ok) throw new Error(await readError(res, 'Narrative parsing failed.'));
        narrativeFacts = await res.json();
        setNarrativeSource(narrativeFacts?.source ?? null);
      }

      const preClaim: PreClaimFacts = {
        insurerName: extraction?.insurerName ?? '',
        policyNumber: extraction?.policyNumber ?? '',
        coverageCriteria: extraction?.coverageCriteria ?? [],
        exclusionsListedVerbatim: extraction?.exclusionsListedVerbatim ?? [],
        requiredDocumentationListed: extraction?.requiredDocumentationListed ?? [],
        rawText: extraction?.rawText ?? '',
        whatHappened: narrativeFacts?.whatHappened ?? '',
        whatWasClaimed: narrativeFacts?.whatWasClaimed ?? '',
        whatWasExpected: narrativeFacts?.whatWasExpected ?? '',
        requiredDocsRequestedBeforeDenial: narrativeFacts?.requiredDocsRequestedBeforeDenial ?? 'unknown',
      };
      setProgressLines((p) => [...p, `Cross-checking ${regulation.label} rules...`]);
      const res = await fetch('/api/preclaim-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facts: preClaim, jurisdiction }),
      });
      if (!res.ok) throw new Error(await readError(res, 'Pre-claim analysis failed.'));
      const data = await res.json();
      setCode(data.code);
      setPreClaimResult(data.result);
      setAnalysisSource(data.source ?? null);
      setProgressLines((p) => [...p, 'Done.']);
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Pre-claim analysis failed.');
    } finally {
      setIntakeLoading(false);
    }
  }

  async function handleAnalyze() {
    setAnalysisError(null);
    setAnalyzeLoading(true);
    setCode(null);
    setAnalysis(null);
    setPreClaimResult(null);
    setProgressLines(['Reading document...']);
    setScreen('analysis');
    try {
      setProgressLines((p) => [...p, `Cross-checking ${regulation.label} rules...`]);
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facts, jurisdiction }),
      });
      if (!res.ok) throw new Error(await readError(res, 'Analysis failed.'));
      const data = await res.json();
      setCode(data.code);
      setAnalysis(data.result);
      setAnalysisSource(data.source ?? null);
      setProgressLines((p) => [...p, 'Done.']);
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Analysis failed.');
    } finally {
      setAnalyzeLoading(false);
    }
  }

  async function handleGenerateComplaint() {
    if (!analysis) return;
    setAnalysisError(null);
    setComplaintLoading(true);
    try {
      const res = await fetch('/api/complaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facts, jurisdiction, analysis }),
      });
      if (!res.ok) throw new Error(await readError(res, 'Drafting failed.'));
      const data = await res.json();
      setLetter(data.letter);
      setComplaintSource(data.source ?? null);
      setCaseSaved(false);
      setScreen('output');
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Drafting failed.');
    } finally {
      setComplaintLoading(false);
    }
  }

  function handleSaveCase() {
    if (!analysis || !letter) return;
    saveCase({
      id: caseNumber,
      savedAt: new Date().toISOString(),
      jurisdiction,
      facts,
      code,
      analysis,
      letter,
    });
    setCaseSaved(true);
    setSavedCases(listSavedCases());
  }

  function startFreshCase() {
    setCaseNumber(makeCaseNumber());
    setScreen('input');
    setPhotoFile(null);
    setNarrativeText('');
    setFacts(EMPTY_FACTS);
    setProgressLines([]);
    setCode(null);
    setAnalysis(null);
    setPreClaimResult(null);
    setLetter(null);
    setError(null);
    setAnalysisError(null);
    setExtractionSource(null);
    setNarrativeSource(null);
    setAnalysisSource(null);
    setComplaintSource(null);
    setJurisdictionWarning(null);
    setCaseSaved(false);
    window.localStorage.removeItem('claim-guardian-case');
    setView('flow');
  }

  function handleOpenSavedCase(id: string) {
    const saved = getSavedCase(id);
    if (!saved) return;
    setCaseNumber(saved.id);
    setJurisdiction(saved.jurisdiction);
    setFacts(saved.facts);
    setCode(saved.code);
    setAnalysis(saved.analysis);
    setLetter(saved.letter);
    setComplaintSource(null);
    setCaseSaved(true);
    setScreen('output');
    setView('flow');
  }

  function inferSpecialty(): string {
    const failed = analysis?.checks.filter((check) => !check.passed) ?? [];
    if (failed.some((check) => /time|deadline|appeal/i.test(`${check.id} ${check.label}`))) return 'appeal';
    if (failed.some((check) => /reason|category|clause/i.test(`${check.id} ${check.label}`))) return 'denial_review';
    return claimStage === 'pre-claim' ? 'pre_claim' : 'denial_review';
  }

  function openBench(origin: Screen) {
    setBenchOrigin(origin);
    setBenchSpecialty(inferSpecialty());
    setView('bench');
  }

  if (view === 'hub') {
    return <Hub onOpenClaimGuardian={() => setView('landing')} />;
  }

  if (view === 'landing') {
    return (
      <Landing
        onBackToHub={() => setView('hub')}
        onStartReview={() => setView('flow')}
        onViewDashboard={() => {
          setSavedCases(listSavedCases());
          setView('dashboard');
        }}
      />
    );
  }

  if (view === 'dashboard') {
    return <Dashboard cases={savedCases} onNewReview={startFreshCase} onOpenCase={handleOpenSavedCase} />;
  }

  if (view === 'bench') {
    return (
      <AppFrame
        step="result"
        onExit={() => setView('landing')}
        largeText={largeText}
        onLargeTextChange={setLargeText}
        onBack={() => setView('flow')}
      >
        <Bench
          jurisdiction={jurisdiction}
          analysis={analysis}
          initialSpecialty={benchSpecialty}
          onBack={() => {
            setView('flow');
            setScreen(benchOrigin);
          }}
        />
      </AppFrame>
    );
  }

  const exitToLanding = () => setView('landing');

  if (screen === 'input') {
    return (
      <AppFrame step="input" onExit={exitToLanding} largeText={largeText} onLargeTextChange={setLargeText}>
        <ScreenInput
          jurisdiction={jurisdiction}
          onJurisdictionChange={setJurisdiction}
          claimStage={claimStage}
          onClaimStageChange={setClaimStage}
          photoFile={photoFile}
          onPhotoChange={setPhotoFile}
          narrativeText={narrativeText}
          onNarrativeChange={setNarrativeText}
          onSubmit={handleSubmitIntake}
          submitDisabled={intakeLoading || (!photoFile && !narrativeText.trim())}
          error={error}
        />
      </AppFrame>
    );
  }

  if (screen === 'confirm') {
    return (
      <AppFrame
        step="confirm"
        onExit={exitToLanding}
        largeText={largeText}
        onLargeTextChange={setLargeText}
        onBack={() => setScreen('input')}
      >
        <ScreenExtraction
          facts={facts}
          onChange={setFacts}
          onConfirm={handleAnalyze}
          loading={analyzeLoading}
          error={error}
          extractionSource={extractionSource}
          narrativeSource={narrativeSource}
          jurisdictionWarning={jurisdictionWarning}
        />
      </AppFrame>
    );
  }

  if (screen === 'analysis') {
    return (
      <AppFrame
        step="analysis"
        onExit={exitToLanding}
        largeText={largeText}
        onLargeTextChange={setLargeText}
        onBack={() => setScreen('confirm')}
      >
        <ScreenAnalysis
          progressLines={progressLines}
          code={code}
          result={analysis}
          regulation={regulation}
          facts={facts}
          jurisdiction={jurisdiction}
          onGenerateComplaint={handleGenerateComplaint}
          onFindSpecialist={() => openBench('analysis')}
          loading={complaintLoading}
          error={analysisError}
          codeSource={analysisSource}
        />
      </AppFrame>
    );
  }

  if (screen === 'preclaim') {
    return (
      <AppFrame
        step="result"
        onExit={exitToLanding}
        largeText={largeText}
        onLargeTextChange={setLargeText}
        onBack={() => setScreen('input')}
      >
        <ScreenPreClaimResult
          progressLines={progressLines}
          code={code}
          result={preClaimResult}
          regulation={regulation}
          error={analysisError}
          codeSource={analysisSource}
          onReadyToFile={startFreshCase}
          jurisdictionWarning={jurisdictionWarning}
        />
      </AppFrame>
    );
  }

  if (screen === 'output' && letter && analysis) {
    return (
      <AppFrame
        step="result"
        onExit={exitToLanding}
        largeText={largeText}
        onLargeTextChange={setLargeText}
        onBack={() => setScreen('analysis')}
      >
        <ScreenOutput
          letter={letter}
          regulation={regulation}
          result={analysis}
          insurerName={facts.insurerName}
          onFindSpecialist={() => openBench('output')}
          onRestart={startFreshCase}
          onSave={handleSaveCase}
          saved={caseSaved}
          letterSource={complaintSource}
        />
      </AppFrame>
    );
  }

  return null;
}
