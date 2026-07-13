import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize server-side Supabase client to verify JWTs
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseServer = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: NextRequest) {
  try {
    // 1. Extract and verify the Supabase JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please sign up or sign in.' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Invalid or expired session.' },
        { status: 401 }
      );
    }

    // 2. Validate Groq API Key
    const apiKey = process.env.GROQ;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Groq API Key (GROQ) is not configured on the server.' },
        { status: 500 }
      );
    }

    // 3. Parse and validate the request body
    const body = await req.json();
    const { prompt, systemPrompt, temperature } = body;

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Missing prompt in request body.' },
        { status: 400 }
      );
    }

    // 4. Define the fallback list of models
    const models = [
      'groq/compound',
      'groq/compound-mini',
      'llama-3.3-70b-versatile',
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b'
    ];

    let lastError: any = null;
    let selectedModel = '';
    let text = '';

    // 5. Try each model sequentially to auto-select the most available one
    for (const model of models) {
      try {
        console.log(`Attempting Groq API generation with model: ${model}`);
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
            temperature: typeof temperature === 'number' ? temperature : 0.4,
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
        selectedModel = model;
        console.log(`Success! Response generated with model: ${model}`);
        break; // Success! Break the fallback loop
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

    return NextResponse.json({ success: true, text, model: selectedModel });
  } catch (err: any) {
    console.error('Error in Groq API proxy:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
