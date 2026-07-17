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

// Helper to load rate limits from filesystem with in-memory fallback
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

// Helper to save rate limits to filesystem
function saveRateLimits() {
  try {
    fs.writeFileSync(LIMIT_FILE, JSON.stringify(inMemoryCache, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write rate limits file:", e);
  }
}

// Perform rate limiting: 5 requests every 24 hours from first request
function checkAndIncrementRateLimit(ip: string, cookieRecordStr: string | undefined): { allowed: boolean; count: number; remaining: number; resetTime: Date; newCookieVal: string } {
  loadRateLimits();
  const now = Date.now();
  const limitWindow = 24 * 60 * 60 * 1000; // 24 hours
  
  let ipRecord = inMemoryCache[ip];
  let cookieRecord = null;
  
  if (cookieRecordStr) {
    try {
      cookieRecord = JSON.parse(cookieRecordStr);
    } catch(e) {}
  }
  
  // Merge state from IP and Cookie to prevent bypass
  let count = 0;
  let firstRequestTime = now;
  
  if (ipRecord && (now - ipRecord.firstRequestTime) < limitWindow) {
    count = Math.max(count, ipRecord.count);
    firstRequestTime = Math.min(firstRequestTime, ipRecord.firstRequestTime);
  }
  if (cookieRecord && (now - cookieRecord.firstRequestTime) < limitWindow) {
    count = Math.max(count, cookieRecord.count);
    firstRequestTime = Math.min(firstRequestTime, cookieRecord.firstRequestTime);
  }
  
  if (count >= 5) {
    return { 
      allowed: false, 
      count, 
      remaining: 0, 
      resetTime: new Date(firstRequestTime + limitWindow),
      newCookieVal: JSON.stringify({ count, firstRequestTime })
    };
  }
  
  count += 1;
  const newRecord = { count, firstRequestTime };
  inMemoryCache[ip] = newRecord;
  saveRateLimits();
  
  return { 
    allowed: true, 
    count, 
    remaining: 5 - count, 
    resetTime: new Date(firstRequestTime + limitWindow),
    newCookieVal: JSON.stringify(newRecord)
  };
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || (req as any).ip || "127.0.0.1";
    
    // Check user authorization first
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

    let rateLimit = { allowed: true, count: 0, remaining: 9999, resetTime: new Date(), newCookieVal: '' };
    
    if (!userObj) {
      const cookieRecordStr = req.cookies.get('ai_rate_limit')?.value;
      rateLimit = checkAndIncrementRateLimit(ip, cookieRecordStr);
      
      if (!rateLimit.allowed) {
        const res = NextResponse.json(
          { 
            success: false, 
            error: `AI Rate limit exceeded. Guest tier is limited to 5 requests per 24 hours. Please Log In or Sign Up to unlock more high-speed AI requests. Your limit resets at ${rateLimit.resetTime.toLocaleTimeString()}.` 
          },
          { status: 429 }
        );
        res.cookies.set('ai_rate_limit', rateLimit.newCookieVal, { maxAge: 24 * 60 * 60, path: '/' });
        return res;
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
      "qwen/qwen3-32b",
      "qwen/qwen3.6-27b",
      "meta-llama/llama-4-scout-17b-16e-instruct",
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b",
      "groq/compound",
      "groq/compound-mini"
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
      const res = NextResponse.json({ success: true, data: parsedData, model: selectedModel });
      if (!userObj && rateLimit.newCookieVal) {
        res.cookies.set('ai_rate_limit', rateLimit.newCookieVal, { maxAge: 24 * 60 * 60, path: '/' });
      }
      return res;
    } catch (parseErr: any) {
      console.error("Failed to parse JSON response from Groq:", text);
      const res = NextResponse.json({ 
        success: false, 
        error: "AI did not return valid JSON. Please try again with a simpler or more specific input.",
        rawText: text 
      }, { status: 500 });
      if (!userObj && rateLimit.newCookieVal) {
        res.cookies.set('ai_rate_limit', rateLimit.newCookieVal, { maxAge: 24 * 60 * 60, path: '/' });
      }
      return res;
    }
  } catch (err: any) {
    console.error("Error in Groq parse/build route:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
