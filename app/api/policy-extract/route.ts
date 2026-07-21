import { NextRequest, NextResponse } from 'next/server';
import { runPolicyExtraction } from '@/lib/ai';
import { JurisdictionId } from '@/lib/types';
import { validateImageFile } from '@/lib/upload';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('photo');
    const jurisdiction = (form.get('jurisdiction') as JurisdictionId) || 'US_CA';
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No photo provided.' }, { status: 400 });
    }
    const validationError = validateImageFile(file);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });
    const bytes = Buffer.from(await file.arrayBuffer());
    const dataUrl = `data:${file.type || 'image/jpeg'};base64,${bytes.toString('base64')}`;
    const { data, source } = await runPolicyExtraction(dataUrl, jurisdiction);
    return NextResponse.json({ ...data, source });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Policy extraction failed.' },
      { status: 500 }
    );
  }
}
