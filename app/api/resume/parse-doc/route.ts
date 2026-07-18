import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase server-side client
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServer = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: NextRequest) {
  try {
    // Check optional user authorization to secure the API
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
        console.warn("Auth verification failed in parse-doc:", err);
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Gemini API Key (GEMINI_API_KEY) is not configured on the server." },
        { status: 500 }
      );
    }

    const { base64Data, mimeType, filename } = await req.json();
    if (!base64Data || !mimeType) {
      return NextResponse.json(
        { success: false, error: "Missing file data or MIME type." },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // Format system prompt to extract perfect structured resume JSON
    const systemInstruction = `You are an elite, world-class resume-writing expert and parser. 
    Analyze the provided document (which is an old resume or career document) and parse it into a structured, professionally polished resume JSON.
    
    You MUST return a JSON object with EXACTLY the following format:
    {
      "name": "Candidate Name",
      "contactLine": "City, ST | Phone | Email | LinkedIn",
      "summary": "Professional summary paragraph...",
      "experiences": [
        {
          "title": "Job Title | Company Name",
          "date": "Month Year - Month Year",
          "bullets": [
            { "text": "Accomplished X as measured by Y by doing Z..." },
            { "text": "Designed and deployed..." }
          ],
          "meta": "Core Stack / Tech / Skills used"
        }
      ],
      "educations": [
        {
          "degree": "Degree/Major | University Name",
          "bullets": [
            { "text": "GPA, Honors, Activities, or coursework..." }
          ]
        }
      ],
      "skills": [
        {
          "title": "Category (e.g. Languages)",
          "items": "Skill1, Skill2, Skill3"
        }
      ]
    }
    
    CRITICAL INSTRUCTION: Return ONLY the raw, valid, minified JSON block matching the above schema. Do not include any pre-text, conversational introductions, markdown code blocks, or follow-up suggestions. Output raw, valid JSON only.`;

    const docPart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Data,
      },
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        docPart,
        systemInstruction,
      ],
    });

    const responseText = response.text || "";
    let cleanJson = responseText.trim();
    
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
    }
    cleanJson = cleanJson.trim();

    try {
      const parsedData = JSON.parse(cleanJson);
      return NextResponse.json({ success: true, data: parsedData, model: "gemini-3.5-flash" });
    } catch (parseErr: any) {
      console.error("Failed to parse JSON response from Gemini:", responseText);
      return NextResponse.json({ 
        success: false, 
        error: "AI did not return valid JSON from document analysis. Please try again with a cleaner document or paste your resume text.",
        rawText: responseText 
      }, { status: 500 });
    }
  } catch (err: any) {
    console.error("Error in parse-doc route:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
