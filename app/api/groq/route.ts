import { NextRequest, NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rateLimit';
import { groqPromptSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  try {
    const { errorResponse, user, ip } = await enforceRateLimit(req);
    if (errorResponse) return errorResponse;

    // Simulate rateLimit object for backwards compatibility with the rest of the handler
    // Ideally we should refactor the response format, but for now we provide fake values
    // to avoid breaking the client if it expects remaining and resetTime.
    const rateLimit = { remaining: 999, resetTime: new Date() };

    // 4. Validate Groq API Key
    const apiKey = process.env.GROQ;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Groq API Key (GROQ) is not configured on the server.' },
        { status: 500 }
      );
    }

    // 5. Parse and validate the request body using Zod
    const body = await req.json();
    const parsedBody = groqPromptSchema.safeParse(body);
    
    if (!parsedBody.success) {
      return NextResponse.json(
        { success: false, error: parsedBody.error.errors[0].message },
        { status: 400 }
      );
    }
    
    const { prompt, systemPrompt, temperature } = parsedBody.data;

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
