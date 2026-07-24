// ============================================================
//  app/api/resume/parse-doc/route.ts — Document Resume Parser
//  Accepts a base64-encoded PDF/DOCX, extracts text precisely
//  using server-side libraries (pdf-parse/mammoth), and sends it 
//  as text context to Groq for structured JSON extraction.
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rateLimit';
import { parseDocSchema } from '@/lib/validations';
import { env } from '@/lib/env';
// @ts-ignore
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

const MODEL_CHAIN = [
  'llama-3.3-70b-versatile',
  'llama3-70b-8192',
  'llama-3.1-8b-instant',
];

const SYSTEM_PROMPT = `You are an elite resume parsing expert. The user will provide raw extracted text from a resume document.
Your task: parse it into a perfectly structured JSON resume object.
CRITICAL INSTRUCTIONS:
1. Do NOT summarize or shorten anything.
2. Extract EVERY SINGLE job, experience, education, certification, and bullet point.
3. If the resume is 4+ pages long, you MUST extract all 4 pages of data. Be completely exhaustive.

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
  ],
  "licenses": [
    { "id": "lic-1", "text": "License/Cert Name (e.g., Registered Nurse, ACLS, BLS)" }
  ],
  "projects": [
    {
      "id": "proj-1",
      "title": "Project Name",
      "date": "Year",
      "meta": "Technologies",
      "bullets": [{ "id": "b-p1", "text": "Project detail..." }]
    }
  ],
  "publications": [
    {
      "id": "pub-1",
      "title": "Publication Name",
      "date": "Year",
      "meta": "Publisher",
      "bullets": [{ "id": "b-pub1", "text": "Detail..." }]
    }
  ],
  "awards": [
    {
      "id": "aw-1",
      "title": "Award Name",
      "date": "Year",
      "meta": "Issuer",
      "bullets": [{ "id": "b-a1", "text": "Detail..." }]
    }
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

    let extractedText = '';
    
    try {
      const buffer = Buffer.from(base64Data, 'base64');
      
      const isPdf = mimeType === 'application/pdf' || filename?.toLowerCase().endsWith('.pdf');
      const isDocx = mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || filename?.toLowerCase().endsWith('.docx');

      if (isPdf) {
        const pdfData = await pdf(buffer);
        extractedText = pdfData.text.trim();
      } else if (isDocx) {
        const docxData = await mammoth.extractRawText({ buffer });
        extractedText = docxData.value.trim();
      } else {
        // Fallback for plain text or unknown types
        extractedText = buffer.toString('utf-8').trim();
      }
      
    } catch (e) {
      console.error("[parse-doc] Failed to extract text natively:", e);
      return NextResponse.json(
        { success: false, error: 'Failed to extract text from the document. The file might be corrupted or password protected.' },
        { status: 400 }
      );
    }

    if (extractedText.length < 50) {
      return NextResponse.json(
        {
          success: false,
          error: 'This file appears to be a scanned image or is empty. Please copy and paste your resume text directly into the text field instead.',
        },
        { status: 422 }
      );
    }

    const userPrompt = `Parse this resume document (${filename ?? mimeType}) into the required JSON structure:\n\n${extractedText.slice(0, 15000)}`;

    let lastError: Error | null = null;

    for (const model of MODEL_CHAIN) {
      try {
        console.log(`[parse-doc] Attempting Groq model: ${model}`);
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.GROQ}`,
          },
          body: JSON.stringify({
            model,
            temperature: 0.1,
            max_tokens: 8000,
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
