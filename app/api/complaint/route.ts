import { NextRequest, NextResponse } from 'next/server';
import { runComplaintDraft } from '@/lib/ai';
import { getRegulation } from '@/lib/regulations';
import { AnalysisResult, CaseFacts, JurisdictionId } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      facts: CaseFacts;
      jurisdiction: JurisdictionId;
      analysis: AnalysisResult;
    };
    const regulation = getRegulation(body.jurisdiction);
    const { data: letter, source } = await runComplaintDraft(body.facts, regulation, body.analysis);
    return NextResponse.json({ letter, source });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Drafting failed.' },
      { status: 500 }
    );
  }
}
