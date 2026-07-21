import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio, MissingApiKeyError } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('audio');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No audio provided.' }, { status: 400 });
    }
    const text = await transcribeAudio(file);
    return NextResponse.json({ text, source: 'gpt' });
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      // No demo fallback for audio, transcription genuinely needs the API.
      // Tell the user to type instead rather than pretending it worked.
      return NextResponse.json(
        { text: '', source: 'local', notice: 'Voice transcription needs an OpenAI key. Type your narrative in the box below instead.' },
        { status: 200 }
      );
    }
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Transcription failed.' },
      { status: 500 }
    );
  }
}
