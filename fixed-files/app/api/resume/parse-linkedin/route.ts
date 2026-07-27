// ============================================================
//  app/api/resume/parse-linkedin/route.ts — LinkedIn Parser
//  Accepts raw LinkedIn profile JSON export or pasted text,
//  and returns a structured resume JSON. Migrated from Gemini.
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { validateCsrfOrigin } from '@/lib/csrf';
import { enforceRateLimit } from '@/lib/rateLimit';
import { parseLinkedinSchema } from '@/lib/validations';
import { env } from '@/lib/env';

const MODEL_CHAIN = [
  'llama-3.3-70b-versatile', // 1K RPD — primary
  'openai/gpt-oss-120b',     // 1K RPD — allowed, separate quota pool
  'llama-3.1-8b-instant',    // 14.4K RPD — deep safety net
];

const SYSTEM_PROMPT = `You are an elite resume parsing expert specializing in LinkedIn profile data.
Your task: extract all professional information from the provided LinkedIn text or JSON data and output a clean, structured resume JSON.

Return ONLY a valid, raw, minified JSON object with EXACTLY this structure:
{
  "name": "Full Name",
  "contactLine": "City, ST | linkedin.com/in/username",
  "summary": "Professional summary...",
  "experiences": [
    {
      "id": "exp-1",
      "title": "Job Title | Company Name – City, ST",
      "date": "Mon Year – Mon Year",
      "bullets": [{ "id": "b-1", "text": "Achievement-focused bullet..." }],
      "meta": "Stack or industry"
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
    const csrfError = validateCsrfOrigin(req);
    if (csrfError) return csrfError;

    const { errorResponse } = await enforceRateLimit(req);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const parsed = parseLinkedinSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { input } = parsed.data;

    // Note: Groq doesn't have web search/grounding like Gemini.
    // For URL inputs we ask the user to export their LinkedIn data as JSON instead.
    const isUrl = input.startsWith('http://') || input.startsWith('https://');

    if (isUrl) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Direct LinkedIn URL parsing is not supported. Please export your LinkedIn profile as a PDF or use the "Copy Profile" option, then paste the text here.',
        },
        { status: 422 }
      );
    }

    const userPrompt = `Parse this LinkedIn profile data into the required JSON structure:\n\n${input.slice(0, 15000)}`;

    let lastError: Error | null = null;

    for (const model of MODEL_CHAIN) {
      try {
        console.log(`[parse-linkedin] Attempting model: ${model}`);
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
        console.error(`[parse-linkedin] Exception with model ${model}:`, lastError.message);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: `AI could not parse your LinkedIn data. Last error: ${lastError?.message ?? 'Unknown'}. Try copy-pasting your profile content instead.`,
      },
      { status: 502 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('[parse-linkedin] Unhandled error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
