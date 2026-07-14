import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServer = createClient(supabaseUrl, supabaseAnonKey);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { rawText } = await req.json();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Parse the following resume text into a structured JSON object.
      The structure must be:
      {
        "name": string,
        "summary": string,
        "experiences": [{ "title": string, "date": string, "bullets": [{ "text": string }] }],
        "educations": [{ "degree": string, "bullets": [{ "text": string }] }],
        "skills": { "items": string }
      }
      Resume text:
      ${rawText}`,
    });
    
    const text = response.text || "{}";
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "");
    const parsedData = JSON.parse(jsonStr);

    return NextResponse.json({ success: true, data: parsedData });
  } catch (err: any) {
    console.error('Error parsing resume:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
