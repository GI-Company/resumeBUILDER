// ============================================================
//  app/api/resume/transcribe/route.ts — Voice → Text via Whisper
//
//  Accepts a base64-encoded audio blob, sends it to Groq's
//  whisper-large-v3-turbo endpoint, and returns the transcript.
//  The client can then optionally send the transcript to the
//  /api/groq endpoint with aiAction="rewrite_bullet" to get a
//  polished, XYZ-formula bullet point.
//
//  Free tier: 2,000 req/day, 28,800 audio seconds/day.
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rateLimit';
import { transcribeSchema } from '@/lib/validations';
import { env } from '@/lib/env';

export async function POST(req: NextRequest) {
  try {
    const { errorResponse } = await enforceRateLimit(req);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const parsed = transcribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { audioBase64, mimeType } = parsed.data;

    // Decode base64 → binary → Blob for multipart upload
    const binaryStr = atob(audioBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const ext = mimeType.split('/')[1]?.split(';')[0] ?? 'webm';
    const audioBlob = new Blob([bytes], { type: mimeType });

    const formData = new FormData();
    formData.append('file', audioBlob, `audio.${ext}`);
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('response_format', 'json');
    formData.append('language', 'en');

    const whisperRes = await fetch(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.GROQ}` },
        body: formData,
      }
    );

    if (!whisperRes.ok) {
      const errText = await whisperRes.text().catch(() => 'unknown');
      console.error('[transcribe] Whisper API error:', errText);
      return NextResponse.json(
        { success: false, error: `Transcription failed: ${whisperRes.status}` },
        { status: 502 }
      );
    }

    const data = await whisperRes.json();
    const transcript: string = data.text ?? '';

    if (!transcript.trim()) {
      return NextResponse.json(
        { success: false, error: 'No speech detected in the audio. Please try again.' },
        { status: 422 }
      );
    }

    return NextResponse.json({ success: true, transcript });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('[transcribe] Unhandled error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
