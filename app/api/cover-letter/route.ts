// ============================================================
//  app/api/cover-letter/route.ts — Cover Letter Generation
//  Migrated from @google/genai → Groq (groq/compound chain)
//  Returns a Server-Sent Events stream for real-time rendering.
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rateLimit';
import { coverLetterSchema } from '@/lib/validations';
import { env } from '@/lib/env';

const MODEL_CHAIN = [
  'groq/compound',
  'llama-3.3-70b-versatile',
  'openai/gpt-oss-120b',
  'groq/compound-mini',
  'llama-3.1-8b-instant',
];

const SYSTEM_PROMPT = `You are an elite executive career coach and cover letter writer with 20 years of experience placing candidates at Fortune 500 companies.

Your task: write a highly compelling, tailored, professional cover letter that precisely matches the candidate's resume to the target job description.

Style Rules:
- Business formal, authoritative, yet genuinely engaging — not robotic.
- Open with a powerful hook that immediately demonstrates value, not "I am writing to apply for..."
- Reference 2-3 specific, quantified achievements from the resume that directly address the job requirements.
- Weave in 3-5 key terms from the job description naturally (ATS optimization).
- Close with a confident, assertive call to action.
- Keep it under 380 words across exactly 4 paragraphs.
- Use placeholders [Date] and [Hiring Manager Name] only where the info is unknown.
- Resolve what you can: candidate name, contact info, company name, role.

CRITICAL: Output ONLY the finished, plain-text cover letter. Zero meta-commentary, zero introductory sentences, zero code blocks. Start directly with the candidate's address or the opening salutation.`;

export async function POST(req: NextRequest) {
  try {
    const { errorResponse, rateLimitResult } = await enforceRateLimit(req);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const parsed = coverLetterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { resumeState, jobDescription, role, company } = parsed.data;

    // Build a rich, structured prompt from the resume state
    const experienceText = resumeState.experiences
      .map(
        (exp) =>
          `• ${exp.title} (${exp.date || 'N/A'})${exp.meta ? ` — ${exp.meta}` : ''}\n${exp.bullets
            .map((b) => `  - ${b.text}`)
            .join('\n')}`
      )
      .join('\n\n');

    const educationText = resumeState.educations
      .map(
        (edu) =>
          `• ${edu.degree}${edu.bullets.length ? `: ${edu.bullets.map((b) => b.text).join('; ')}` : ''}`
      )
      .join('\n');

    const skillsText = resumeState.skills
      .map((sk) => `${sk.title}: ${sk.items}`)
      .join(' | ');

    const userPrompt = `
Target Role: ${role || 'Not specified'}
Target Company: ${company || 'Not specified'}
Job Description:
${jobDescription || 'Not provided'}

---

Candidate Profile:
Name: ${resumeState.name || 'Candidate'}
Contact: ${resumeState.contactLine || ''}
Summary: ${resumeState.summary || ''}

Work Experience:
${experienceText || 'Not provided'}

Education:
${educationText || 'Not provided'}

Skills: ${skillsText || 'Not provided'}

---

Generate the tailored cover letter now.
`.trim();

    let lastError: Error | null = null;

    for (const model of MODEL_CHAIN) {
      try {
        console.log(`[cover-letter] Attempting model: ${model}`);

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.GROQ}`,
          },
          body: JSON.stringify({
            model,
            stream: true,
            temperature: 0.6, // Slightly higher for creative writing
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userPrompt },
            ],
          }),
        });

        if (!groqRes.ok || !groqRes.body) {
          const errText = await groqRes.text().catch(() => 'unknown');
          console.warn(`[cover-letter] Model ${model} failed ${groqRes.status}:`, errText);
          lastError = new Error(`Model ${model} returned ${groqRes.status}`);
          continue;
        }

        const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
        const writer = writable.getWriter();
        const encoder = new TextEncoder();

        const metaComment = encoder.encode(
          `: meta ${JSON.stringify({
            model,
            remaining: rateLimitResult?.remaining ?? 999,
            resetTime: rateLimitResult?.resetTime?.toISOString() ?? null,
          })}\n\n`
        );

        (async () => {
          try {
            await writer.write(metaComment);
            const reader = groqRes.body!.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              await writer.write(value);
            }
          } catch (e) {
            console.error('[cover-letter] Stream pipe error:', e);
          } finally {
            await writer.close().catch(() => {});
          }
        })();

        console.log(`[cover-letter] Streaming with model: ${model}`);
        return new Response(readable, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'X-Model': model,
          },
        });
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(`[cover-letter] Exception with model ${model}:`, lastError.message);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: `All AI models are currently unavailable. Last error: ${lastError?.message ?? 'Unknown'}`,
      },
      { status: 502 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('[cover-letter] Unhandled error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
