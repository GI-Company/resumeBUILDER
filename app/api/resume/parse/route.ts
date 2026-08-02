import { NextRequest, NextResponse } from "next/server";
import { validateCsrfOrigin } from '@/lib/csrf';
import { enforceRateLimit } from '@/lib/rateLimit';
import { parseResumeSchema } from '@/lib/validations';
import { env } from '@/lib/env';

// Canonical free-tier model chain (ordered by quality for parsing tasks)
const MODEL_CHAIN = [
  'llama-3.3-70b-versatile', // 1K RPD — primary
  'openai/gpt-oss-120b',     // 1K RPD — allowed, separate quota pool
  'llama-3.1-8b-instant',    // 14.4K RPD — deep safety net
];
const SYSTEM_PROMPT = `You are an elite, world-class resume-writing expert. Based on the user's input (which could be an old resume, a prompt describing their career, list of achievements, or unstructured text), write a high-impact, professional resume.

MERGE RULE: If the user provides an "EXISTING RESUME STATE" section, you MUST merge the new request into that existing data. Do NOT drop, omit, or replace any existing entries unless the user explicitly asks to remove something, EXCEPT if the existing data contains placeholder values like "Alex Morgan", "Jane Doe", or "dev@example.com" - you MUST overwrite placeholder data with the user's actual information. Always return the COMPLETE, combined resume with all existing entries preserved alongside any new additions. New entries should be added in the appropriate section at a logical position (e.g., most recent experience first).

CRITICAL INSTRUCTION: Do NOT put degrees, education, or schools into the "experiences" array. Educations must be strictly placed ONLY in the "educations" array.

You MUST return a JSON object with EXACTLY the following format:
{
  "name": "Jane Doe",
  "contactLine": "City, ST | (123) 456-7890 | email@domain.com | linkedin.com/in/username",
  "summary": "Professional summary paragraph...",
  "experiences": [
    {
      "id": "exp-1",
      "title": "Senior Frontend Engineer | Tech Company",
      "date": "Jan 2022 - Present",
      "bullets": [
        { "id": "b-1", "text": "Designed and deployed..." },
        { "id": "b-2", "text": "Collaborated with..." }
      ],
      "meta": "Stack: React, TypeScript, Tailwind"
    }
  ],
  "educations": [
    {
      "id": "edu-1",
      "degree": "B.S. in Computer Science | University Name",
      "date": "2020",
      "bullets": [{ "id": "b-e1", "text": "GPA 3.8, Honors" }]
    }
  ],
  "projects": [
    {
      "id": "proj-1",
      "title": "Open Source Contributions",
      "date": "2022",
      "bullets": [{ "id": "b-p1", "text": "Contributed to React core" }]
    }
  ],
  "publications": [],
  "awards": [],
  "licenses": [],
  "skills": [
    { "id": "sk-1", "title": "Programming Languages", "items": "TypeScript, JavaScript, Python" },
    { "id": "sk-2", "title": "Frameworks & Databases", "items": "React, Next.js, PostgreSQL" }
  ]
}

CRITICAL: Do NOT use placeholder names like 'Jane Doe'. If the user's name is not available, leave it blank. Return ALL relevant sections found in the text.

CRITICAL INSTRUCTION: Return ONLY the JSON block. No pre-text, no markdown code blocks, no follow-up text. Raw valid JSON only.`;

export async function POST(req: NextRequest) {
  try {
    const csrfError = validateCsrfOrigin(req);
    if (csrfError) return csrfError;

    const { errorResponse, rateLimitResult } = await enforceRateLimit(req);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const parsedBody = parseResumeSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { success: false, error: parsedBody.error.issues[0].message },
        { status: 400 }
      );
    }

    const { rawText, existingResume } = parsedBody.data;

    // Build the user message: include existing resume state if provided
    let userMessage = rawText;
    if (existingResume && typeof existingResume === 'object') {
      userMessage = `EXISTING RESUME STATE (preserve all existing entries, merge new request into this):\n${JSON.stringify(existingResume)}\n\nUSER REQUEST:\n${rawText}`;
    }

    let lastError: Error | null = null;

    for (const model of MODEL_CHAIN) {
      try {
        console.log(`[parse] Attempting model: ${model}`);
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.GROQ}`,
          },
          body: JSON.stringify({
            model,
            temperature: 0.2,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userMessage },
            ],
          }),
        });

        if (!response.ok) {
          lastError = new Error(`Model ${model} returned ${response.status}`);
          continue;
        }

        const groqData = await response.json();
        let text: string = groqData.choices?.[0]?.message?.content ?? '';
        text = text.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();

        const parsedData = JSON.parse(text);
        return NextResponse.json({ success: true, data: parsedData, model });
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(`[parse] Exception with model ${model}:`, lastError.message);
      }
    }

    return NextResponse.json(
      { success: false, error: `All Groq models failed. Last error: ${lastError?.message ?? 'Unknown'}` },
      { status: 502 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('[parse] Unhandled error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
