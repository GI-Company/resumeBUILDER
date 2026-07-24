// ============================================================
//  app/api/resume/parse-doc/route.ts — Document Resume Parser
//  Accepts a base64-encoded PDF/DOCX, sends it as text context
//  to Groq for structured JSON extraction. Migrated from Gemini.
//
//  NOTE: Groq doesn't support inline binary file uploads like
//  Gemini Vision. We first decode the base64 to extract any
//  embedded text (for text-based PDFs/DOCX) and send it as
//  the user message. For scanned images, we tell the user to
//  copy-paste their text instead.
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rateLimit';
import { parseDocSchema } from '@/lib/validations';
import { env } from '@/lib/env';

const MODEL_CHAIN = [
  'llama-3.3-70b-versatile',
  'llama3-70b-8192',
  'llama-3.1-8b-instant',
];

const SYSTEM_PROMPT = `You are an elite resume parsing expert. The user will provide raw extracted text from a resume document.
Your task: parse it into a perfectly structured JSON resume object.

Return ONLY a valid, raw, minified JSON object with EXACTLY this structure:
{
  "name": "Full Name",
  "contactLine": "City, ST | Phone | Email | LinkedIn",
  "summary": "Professional summary...",
  "experiences": [
    {
      "id": "exp-1",
      "title": "Job Title | Company Name – City, ST",
      "date": "Mon Year – Mon Year",
      "bullets": [{ "id": "b-1", "text": "Achievement-focused bullet..." }],
      "meta": "Stack or technologies used"
    }
  ],
  "educations": [
    {
      "id": "edu-1",
      "degree": "Degree, Major | University Name",
      "date": "Year",
      "bullets": [{ "id": "b-e1", "text": "GPA or honors..." }]
    }
  ],
  "skills": [
    { "id": "sk-1", "title": "Category", "items": "Skill1, Skill2, Skill3" }
  ]
}

CRITICAL: No markdown, no code blocks, no commentary. Raw valid JSON only.`;

export async function POST(req: NextRequest) {
  try {
    const { errorResponse } = await enforceRateLimit(req);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const parsed = parseDocSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { base64Data, mimeType, filename } = parsed.data;

    // Attempt to extract text from the base64 data
    // For text-based PDFs and DOCX, the base64 often contains readable ASCII
    let extractedText = '';
    try {
      const decoded = atob(base64Data);
      // Extract printable ASCII characters (crude but effective for text-based docs)
      extractedText = decoded.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s{3,}/g, '\n').trim();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Could not decode the uploaded file. Please try copy-pasting your resume text instead.' },
        { status: 400 }
      );
    }

    if (extractedText.length < 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'This file appears to be a scanned image or is not text-readable. Please copy and paste your resume text directly into the text field.',
        },
        { status: 422 }
      );
    }

    const userPrompt = `Parse this resume document (${filename ?? mimeType}) into the required JSON structure:\n\n${extractedText.slice(0, 12000)}`;

    let lastError: Error | null = null;

    for (const model of MODEL_CHAIN) {
      try {
        console.log(`[parse-doc] Attempting model: ${model}`);
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.GROQ}`,
          },
          body: JSON.stringify({
            model,
            temperature: 0.1,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userPrompt },
            ],
          }),
        });

        if (!res.ok) {
          lastError = new Error(`Model ${model} returned ${res.status}`);
          continue;
        }

        const data = await res.json();
        let raw: string = data.choices?.[0]?.message?.content ?? '';
        raw = raw.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();

        const parsedData = JSON.parse(raw);
        return NextResponse.json({ success: true, data: parsedData, model });
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(`[parse-doc] Exception with model ${model}:`, lastError.message);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: `AI could not parse the document. Last error: ${lastError?.message ?? 'Unknown'}. Try copy-pasting your resume text instead.`,
      },
      { status: 502 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('[parse-doc] Unhandled error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
