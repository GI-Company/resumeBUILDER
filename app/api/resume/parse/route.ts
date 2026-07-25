import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from '@/lib/rateLimit';
import { parseResumeSchema } from '@/lib/validations';
import { env } from '@/lib/env';

// Canonical free-tier model chain (ordered by quality for parsing tasks)
const MODEL_CHAIN = [
  'llama-3.3-70b-versatile',
  'llama3-70b-8192',
  'llama-3.1-8b-instant',
];
const SYSTEM_PROMPT = `You are an elite, world-class resume-writing expert. Based on the user's input (which could be an old resume, a prompt describing their career, list of achievements, or unstructured text), write a high-impact, professional resume.

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
    const { errorResponse } = await enforceRateLimit(req);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const parsedBody = parseResumeSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { success: false, error: parsedBody.error.issues[0].message },
        { status: 400 }
      );
    }

    const { rawText } = parsedBody.data;
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
              { role: 'user', content: rawText },
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
