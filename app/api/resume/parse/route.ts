import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Initialize Supabase server-side client
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServer = createClient(supabaseUrl, supabaseAnonKey);

const LIMIT_FILE = "/tmp/ai_rate_limits.json";
let inMemoryCache: Record<string, { count: number; firstRequestTime: number }> = {};

function loadRateLimits() {
  try {
    if (fs.existsSync(LIMIT_FILE)) {
      const data = fs.readFileSync(LIMIT_FILE, "utf-8");
      inMemoryCache = JSON.parse(data);
    }
  } catch (e) {
    console.error("Failed to load rate limits file, using in-memory cache:", e);
  }
}

function saveRateLimits() {
  try {
    fs.writeFileSync(LIMIT_FILE, JSON.stringify(inMemoryCache, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write rate limits file:", e);
  }
}

function checkAndIncrementRateLimit(ip: string): { allowed: boolean; count: number; remaining: number; resetTime: Date } {
  loadRateLimits();
  const now = Date.now();
  const limitWindow = 24 * 60 * 60 * 1000; // 24 hours
  
  let record = inMemoryCache[ip];
  
  if (!record) {
    record = { count: 1, firstRequestTime: now };
    inMemoryCache[ip] = record;
    saveRateLimits();
    return { allowed: true, count: 1, remaining: 4, resetTime: new Date(now + limitWindow) };
  }
  
  const elapsed = now - record.firstRequestTime;
  
  if (elapsed >= limitWindow) {
    record.count = 1;
    record.firstRequestTime = now;
    saveRateLimits();
    return { allowed: true, count: 1, remaining: 4, resetTime: new Date(now + limitWindow) };
  }
  
  if (record.count >= 10) { // Keep it higher or same as API
    return { 
      allowed: false, 
      count: record.count, 
      remaining: 0, 
      resetTime: new Date(record.firstRequestTime + limitWindow) 
    };
  }
  
  record.count += 1;
  saveRateLimits();
  return { 
    allowed: true, 
    count: record.count, 
    remaining: 10 - record.count, 
    resetTime: new Date(record.firstRequestTime + limitWindow) 
  };
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || (req as any).ip || "127.0.0.1";
    const rateLimit = checkAndIncrementRateLimit(ip);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: `AI Rate limit exceeded. You are allowed 10 requests per 24 hours. Your limit resets at ${rateLimit.resetTime.toLocaleTimeString()}.` 
        },
        { status: 429 }
      );
    }

    // Optional user authorization
    let userObj = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);
        if (!authError && user) {
          userObj = user;
        }
      } catch (err) {
        console.warn("Optional auth verification failed:", err);
      }
    }

    const apiKey = process.env.GROQ;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Groq API Key (GROQ) is not configured on the server." },
        { status: 500 }
      );
    }

    const { rawText } = await req.json();
    if (!rawText) {
      return NextResponse.json(
        { success: false, error: "Missing rawText in request body." },
        { status: 400 }
      );
    }

    // Attempting models
    const models = [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "mixtral-8x7b-32768"
    ];

    let lastError: any = null;
    let selectedModel = "";
    let text = "";

    for (const model of models) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: "system",
                content: `You are an elite, world-class resume-writing expert. Based on the user's input (which could be an old resume, a prompt describing their career, list of achievements, or unstructured text), write a high-impact, professional resume.
                
                You MUST return a JSON object with EXACTLY the following format:
                {
                  "name": "Jane Doe",
                  "contactLine": "City, ST | (123) 456-7890 | email@domain.com | linkedin.com/in/username",
                  "summary": "Professional summary paragraph...",
                  "experiences": [
                    {
                      "title": "Senior Frontend Engineer | Tech Company",
                      "date": "Jan 2022 - Present",
                      "bullets": [
                        { "text": "Designed and deployed..." },
                        { "text": "Collaborated with..." }
                      ],
                      "meta": "Stack: React, TypeScript, Tailwind"
                    }
                  ],
                  "educations": [
                    {
                      "degree": "B.S. in Computer Science | University Name",
                      "bullets": [
                        { "text": "GPA 3.8, Honors" }
                      ]
                    }
                  ],
                  "skills": [
                    {
                      "title": "Programming Languages",
                      "items": "TypeScript, JavaScript, Python"
                    },
                    {
                      "title": "Frameworks & Databases",
                      "items": "React, Next.js, PostgreSQL"
                    }
                  ]
                }
                
                CRITICAL INSTRUCTION: Return ONLY the JSON block. Do not include any pre-text, conversational introductions, markdown code blocks (e.g. do not wrap in \`\`\`json), or follow-up suggestions. Output raw, valid, minified JSON only.`
              },
              {
                role: "user",
                content: rawText
              }
            ],
            temperature: 0.2,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`Model ${model} failed with status ${response.status}:`, errorText);
          lastError = new Error(`Model ${model} returned status ${response.status}`);
          continue;
        }

        const groqData = await response.json();
        text = groqData.choices?.[0]?.message?.content || "";
        selectedModel = model;
        break;
      } catch (err: any) {
        console.error(`Exception with model ${model} in parse:`, err);
        lastError = err;
      }
    }

    if (!selectedModel) {
      return NextResponse.json(
        { success: false, error: "All Groq models failed. " + (lastError?.message || "Network error") },
        { status: 502 }
      );
    }

    // Parse text clean
    let cleanJson = text.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
    }
    cleanJson = cleanJson.trim();

    try {
      const parsedData = JSON.parse(cleanJson);
      return NextResponse.json({ success: true, data: parsedData, model: selectedModel });
    } catch (parseErr: any) {
      console.error("Failed to parse JSON response from Groq:", text);
      return NextResponse.json({ 
        success: false, 
        error: "AI did not return valid JSON. Please try again with a simpler or more specific input.",
        rawText: text 
      }, { status: 500 });
    }
  } catch (err: any) {
    console.error("Error in Groq parse/build route:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
