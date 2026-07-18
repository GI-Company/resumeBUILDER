import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load or initialize Supabase server-side client
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServer = createClient(supabaseUrl, supabaseAnonKey);

// Rate limiting is now handled securely via Supabase RPC to work correctly on serverless platforms
async function checkAndIncrementRateLimit(ip: string): Promise<{ allowed: boolean; count: number; remaining: number; resetTime: Date }> {
  try {
    const { data, error } = await supabaseServer.rpc('check_guest_ai_limit', { p_ip: ip });
    if (error || !data) {
      console.error('Supabase rate limit RPC failed:', error);
      // Fail open gracefully if DB is down, but log the error
      return { allowed: true, count: 1, remaining: 4, resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000) };
    }
    return {
      allowed: data.allowed,
      count: data.count,
      remaining: data.remaining,
      resetTime: new Date(data.resetTime)
    };
  } catch (err) {
    console.error('Rate limit exception:', err);
    return { allowed: true, count: 1, remaining: 4, resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000) };
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Get client IP address for robust rate limiting
    // Note: Vercel sets x-real-ip and x-forwarded-for. We prefer x-real-ip if available.
    const ip = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0].trim() || (req as any).ip || '127.0.0.1';
    
    // 2. Extract JWT auth: Logged-in users can be identified, and get unlimited requests
    let userObj = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);
        if (!authError && user) {
          userObj = user;
        }
      } catch (err) {
        console.warn('Optional auth verification failed:', err);
      }
    }

    // 3. Enforce 5 AI requests every 24 hours ONLY for guests
    let rateLimit = { allowed: true, count: 0, remaining: 9999, resetTime: new Date() };
    if (!userObj) {
      rateLimit = await checkAndIncrementRateLimit(ip);
      
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { 
            success: false, 
            error: `AI Rate limit exceeded. Guest tier is limited to 5 requests per 24 hours. Please Log In or Sign Up to unlock more high-speed AI requests. Your limit resets at ${rateLimit.resetTime.toLocaleTimeString()}.` 
          },
          { status: 429 }
        );
      }
    }

    // 4. Validate Groq API Key
    const apiKey = process.env.GROQ;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Groq API Key (GROQ) is not configured on the server.' },
        { status: 500 }
      );
    }

    // 5. Parse and validate the request body
    const body = await req.json();
    const { prompt, systemPrompt, temperature } = body;

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Missing prompt in request body.' },
        { status: 400 }
      );
    }

    // 6. Define the fallback list of models to optimize response times and availability
    const models = [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'qwen/qwen3-32b',
      'qwen/qwen3.6-27b',
      'meta-llama/llama-4-scout-17b-16e-instruct',
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'groq/compound',
      'groq/compound-mini'
    ];

    let lastError: any = null;
    let selectedModel = '';
    let text = '';

    // 7. Try each model sequentially to auto-select the most available one
    for (const model of models) {
      try {
        console.log(`Attempting Groq API generation with model: ${model} (IP: ${ip})`);
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'system',
                content: systemPrompt || 'You are an elite, professional resume-writing assistant. Refine, improve, or suggest phrasing that is impact-driven, professional, and clear. Maintain a high-concurrency, premium technical tone and output ONLY the revised text or requested sections without conversational filler.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: typeof temperature === 'number' ? temperature : 0.4
          }),
        });

        if (!groqResponse.ok) {
          const errorText = await groqResponse.text();
          console.warn(`Model ${model} failed with status ${groqResponse.status}:`, errorText);
          lastError = new Error(`Model ${model} returned status ${groqResponse.status}`);
          continue; // Try next model
        }

        const groqData = await groqResponse.json();
        text = groqData.choices?.[0]?.message?.content || '';
        if (!text.trim()) {
            throw new Error("API returned empty response.");
        }
        selectedModel = model;
        console.log(`Success! Response generated with model: ${model}`);
        
        const responseData = NextResponse.json({ 
          success: true, 
          text, 
          model: selectedModel,
          remaining: rateLimit.remaining,
          resetTime: rateLimit.resetTime.toISOString()
        });
        return responseData;
        // break; // Success! Break the fallback loop
      } catch (err: any) {
        console.error(`Exception with model ${model}:`, err);
        lastError = err;
        // Continue to the next model
      }
    }

    if (!selectedModel) {
      return NextResponse.json(
        { success: false, error: 'All configured models failed or are currently unavailable. Last error: ' + (lastError?.message || 'Network error') },
        { status: 502 }
      );
    }

    // This part should technically not be reached if the loop breaks or returns early
    const finalResponse = NextResponse.json({ 
      success: true, 
      text, 
      model: selectedModel,
      remaining: rateLimit.remaining,
      resetTime: rateLimit.resetTime.toISOString()
    });
    return finalResponse;

  } catch (err: any) {
    console.error('Error in Groq API proxy:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
