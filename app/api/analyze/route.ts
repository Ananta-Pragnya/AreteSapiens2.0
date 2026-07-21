import { NextRequest, NextResponse } from 'next/server';
import { runAnalysisPipeline } from '@/lib/pipeline';
import { getRegulation } from '@/lib/regulations';
import { CaseFacts, JurisdictionId } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      facts: CaseFacts;
      jurisdiction: JurisdictionId;
    };

    const regulation = getRegulation(body.jurisdiction);
    const { code, result, source } = await runAnalysisPipeline(body.facts, regulation);

    return NextResponse.json({ code, result, source });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Analysis failed.' },
      { status: 500 }
    );
  }
}
