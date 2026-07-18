import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from '@/lib/rateLimit';
import { parseResumeSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  try {
    const { errorResponse } = await enforceRateLimit(req);
    if (errorResponse) return errorResponse;

    const apiKey = process.env.GROQ;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Groq API Key (GROQ) is not configured on the server." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const parsedBody = parseResumeSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { success: false, error: parsedBody.error.issues[0].message },
        { status: 400 }
      );
    }

    const { rawText } = parsedBody.data;

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
      return res;
    } catch (parseErr: any) {
      console.error("Failed to parse JSON response from Groq:", text);
      const res = NextResponse.json({ 
        success: false, 
        error: "AI did not return valid JSON. Please try again with a simpler or more specific input.",
        rawText: text 
      }, { status: 500 });
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
