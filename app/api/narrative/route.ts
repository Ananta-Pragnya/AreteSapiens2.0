import { NextRequest, NextResponse } from 'next/server';
import { runNarrativeParse } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const { text } = (await req.json()) as { text?: string };
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'No narrative text provided.' }, { status: 400 });
    }
    const { data, source } = await runNarrativeParse(text);
    return NextResponse.json({ ...data, source });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Narrative parsing failed.' },
      { status: 500 }
    );
  }
}
