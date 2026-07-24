// ============================================================
//  app/api/groq/route.ts — Smart Task-Based AI Routing + Streaming
//
//  Routes each AI action to the optimal Groq model chain based on
//  the actual free-tier limits:
//
//  complex tasks (cover_letter, tailor_to_job, generate_summary):
//    groq/compound → llama-3.3-70b-versatile → openai/gpt-oss-120b → groq/compound-mini
//
//  quick tasks (rewrite_bullet, suggest_skills, general):
//    llama-3.1-8b-instant → openai/gpt-oss-20b → qwen/qwen3.6-27b → llama-3.3-70b-versatile
//
//  Returns a Server-Sent Events (SSE) stream so the UI can render
//  tokens in real-time as they arrive from Groq.
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rateLimit';
import { groqPromptSchema } from '@/lib/validations';
import { env } from '@/lib/env';
import type { AiAction } from '@/lib/types';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ---------------------------------------------------------------------------
// Model routing table — ordered by quality, respects free-tier reality
// ---------------------------------------------------------------------------
const MODEL_CHAINS: Record<'complex' | 'quick', string[]> = {
  // Complex: needs deep reasoning, large context. groq/compound has no token/day cap.
  complex: [
    'groq/compound',
    'llama-3.3-70b-versatile',
    'openai/gpt-oss-120b',
    'groq/compound-mini',
    'llama-3.1-8b-instant',   // emergency fallback (14.4K req/day)
  ],
  // Quick: speed and volume matter. llama-3.1-8b-instant has 14,400 req/day.
  quick: [
    'llama-3.1-8b-instant',
    'openai/gpt-oss-20b',
    'qwen/qwen3.6-27b',
    'llama-3.3-70b-versatile', // escalate if small model struggles
    'groq/compound-mini',
  ],
};

const COMPLEX_ACTIONS: AiAction[] = ['cover_letter', 'tailor_to_job', 'generate_summary'];

function getModelChain(action: AiAction): string[] {
  return COMPLEX_ACTIONS.includes(action) ? MODEL_CHAINS.complex : MODEL_CHAINS.quick;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const { errorResponse, user, rateLimitResult } = await enforceRateLimit(req);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const parsed = groqPromptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { prompt, systemPrompt, temperature, aiAction } = parsed.data;
    const modelChain = getModelChain(aiAction);

    const defaultSystemPrompt =
      'You are an elite, professional resume-writing assistant. Refine, improve, or suggest phrasing that is impact-driven, professional, and clear. Maintain a high-concurrency, premium technical tone and output ONLY the revised text or requested sections without any conversational filler, introductions, or meta-commentary.';

    // Try each model in order until one succeeds
    let lastError: Error | null = null;

    for (const model of modelChain) {
      try {
        console.log(`[groq] Attempting model: ${model} | action: ${aiAction} | user: ${user?.id ?? 'guest'}`);

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.GROQ}`,
          },
          body: JSON.stringify({
            model,
            stream: true,
            temperature: typeof temperature === 'number' ? temperature : 0.4,
            messages: [
              { role: 'system', content: systemPrompt || defaultSystemPrompt },
              { role: 'user', content: prompt },
            ],
          }),
        });

        if (!groqRes.ok || !groqRes.body) {
          const errText = await groqRes.text().catch(() => 'unknown error');
          console.warn(`[groq] Model ${model} returned ${groqRes.status}:`, errText);
          lastError = new Error(`Model ${model} returned status ${groqRes.status}`);
          continue;
        }

        // ----------------------------------------------------------------
        // Stream the SSE response from Groq straight back to the client,
        // prepending a custom "X-Model" header and injecting rate limit info
        // into the first chunk via a TransformStream.
        // ----------------------------------------------------------------
        const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
        const writer = writable.getWriter();
        const encoder = new TextEncoder();

        // Inject rate limit metadata as a special SSE comment in the first write
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
            console.error('[groq] Stream pipe error:', e);
          } finally {
            await writer.close().catch(() => {});
          }
        })();

        console.log(`[groq] Streaming with model: ${model}`);
        
        // Fire-and-forget logging to public activity feed for social proof
        const activityMsg = aiAction === 'tailor_to_job' ? '🚀 Someone just tailored their resume to a job description'
          : aiAction === 'generate_summary' ? '✍️ A user generated an executive summary with AI'
          : aiAction === 'cover_letter' ? '✨ Someone crafted a cover letter using Agent Rez'
          : aiAction === 'suggest_skills' ? '🎯 A user uncovered high-demand ATS keywords'
          : '⚡ Someone just optimized a resume bullet with AI';
        
        supabase.from('public_activity_feed').insert([
          { event_type: 'AI_USED', display_message: activityMsg }
        ]).then(() => {}).catch((e: any) => console.error('[groq] Failed to log activity:', e));

        return new Response(readable, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'X-Model': model,
            'X-Remaining': String(rateLimitResult?.remaining ?? 999),
          },
        });
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(`[groq] Exception with model ${model}:`, lastError.message);
      }
    }

    // All models failed
    return NextResponse.json(
      {
        success: false,
        error: `All AI models are currently unavailable. Last error: ${lastError?.message ?? 'Unknown error'}. Please try again in a moment.`,
      },
      { status: 502 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('[groq] Unhandled error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
