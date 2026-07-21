import { NextRequest, NextResponse } from 'next/server';
import { runPreClaimPipeline } from '@/lib/pipeline';
import { getRegulation } from '@/lib/regulations';
import { JurisdictionId, PreClaimFacts } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { facts: PreClaimFacts; jurisdiction: JurisdictionId };
    const regulation = getRegulation(body.jurisdiction);
    const { code, result, source } = await runPreClaimPipeline(body.facts, regulation);
    return NextResponse.json({ code, result, source });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Pre-claim analysis failed.' },
      { status: 500 }
    );
  }
}
