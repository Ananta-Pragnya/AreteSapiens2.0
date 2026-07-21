import { NextRequest, NextResponse } from 'next/server';
import { answerCaseQuestion } from '@/lib/consulting';
import { getRegulation } from '@/lib/regulations';
import { AnalysisResult, CaseFacts, JurisdictionId } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      question: string;
      facts: CaseFacts;
      analysis: AnalysisResult;
      jurisdiction: JurisdictionId;
    };
    if (!body.question?.trim()) {
      return NextResponse.json({ error: 'Enter a question about your case.' }, { status: 400 });
    }
    const answer = await answerCaseQuestion(body.question.trim(), body.facts, body.analysis, getRegulation(body.jurisdiction));
    return NextResponse.json(answer);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Could not check that question against the regulations.' }, { status: 500 });
  }
}
