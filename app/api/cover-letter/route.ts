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
        console.warn("Auth verification failed in cover-letter:", err);
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Gemini API Key (GEMINI_API_KEY) is not configured on the server." },
        { status: 500 }
      );
    }

    const { resumeState, jobDescription, role, company } = await req.json();
    if (!resumeState) {
      return NextResponse.json(
        { success: false, error: "Missing active resume data." },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // Format prompt to generate a gorgeous cover letter matching the candidate's resume
    const systemInstruction = `You are an elite executive career coach and cover letter writer.
    Your task is to write a highly compelling, tailored, and professional cover letter that matches the candidate's resume to the target job description or role.
    
    Style Guidelines:
    - Business formal / highly professional yet engaging.
    - Focus on tangible achievements and metrics from the candidate's resume.
    - Tailor the letter specifically to the role/company provided.
    - Keep it under 400 words (4 punchy paragraphs max).
    - Format with placeholders for [Date] or [Hiring Manager Name] where appropriate, but resolve what you can (like the candidate's name and contact details).
    - Do NOT include any meta-text, introductions, or code blocks in your final output. Return ONLY the finished, formatted plain-text cover letter.`;

    const candidateSummary = `
    Candidate Name: ${resumeState.name || "Alex Morgan"}
    Contact Info: ${resumeState.contactLine || ""}
    Summary: ${resumeState.summary || ""}
    
    Work Experience:
    ${(resumeState.experiences || []).map((exp: any) => `- ${exp.title} (${exp.date || "N/A"}): ${ (exp.bullets || []).map((b: any) => b.text).join("; ") }`).join("\n")}
    
    Education:
    ${(resumeState.educations || []).map((edu: any) => `- ${edu.degree}: ${ (edu.bullets || []).map((b: any) => b.text).join("; ") }`).join("\n")}
    
    Skills:
    ${(resumeState.skills || []).map((sk: any) => `- ${sk.title}: ${sk.items}`).join("\n")}
    `;

    const promptText = `
    Target Role: ${role || "Target Role"}
    Target Company: ${company || "Target Company"}
    Job Description: ${jobDescription || "Not provided"}
    
    Here is the candidate's resume data:
    ${candidateSummary}
    
    Generate the tailored cover letter now.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { text: systemInstruction },
        { text: promptText },
      ],
    });

    const responseText = response.text || "";
    return NextResponse.json({ success: true, text: responseText, model: "gemini-3.5-flash" });
  } catch (err: any) {
    console.error("Error in cover-letter route:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
