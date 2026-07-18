import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json();
    if (!input) {
      return NextResponse.json(
        { success: false, error: "Missing input in request body." },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    let prompt = "";
    
    // Check if input is a URL
    if (input.startsWith("http://") || input.startsWith("https://")) {
      prompt = `Extract the professional resume information from this LinkedIn profile URL or public URL: ${input}. 
Use Google Search if necessary to look up the profile. 
You MUST return a JSON object with EXACTLY the following format:
{
  "name": "Jane Doe",
  "contactLine": "City, ST | linkedin.com/in/username",
  "summary": "Professional summary paragraph...",
  "experiences": [
    {
      "title": "Senior Frontend Engineer | Tech Company",
      "date": "Jan 2022 - Present",
      "bullets": [
        { "text": "Designed and deployed..." }
      ],
      "meta": "Stack: React, TypeScript"
    }
  ],
  "educations": [
    {
      "degree": "B.S. in Computer Science | University Name",
      "bullets": []
    }
  ],
  "skills": [
    {
      "title": "Core Skills",
      "items": "TypeScript, JavaScript, Python"
    }
  ]
}
CRITICAL INSTRUCTION: Return ONLY the JSON block. Do not include any markdown formatting like \`\`\`json. Return raw, valid, minified JSON only.`;
    } else {
      prompt = `Extract the professional resume information from this LinkedIn Data JSON or unstructured text:
${input}

You MUST return a JSON object with EXACTLY the following format:
{
  "name": "Jane Doe",
  "contactLine": "City, ST | linkedin.com/in/username",
  "summary": "Professional summary paragraph...",
  "experiences": [
    {
      "title": "Senior Frontend Engineer | Tech Company",
      "date": "Jan 2022 - Present",
      "bullets": [
        { "text": "Designed and deployed..." }
      ],
      "meta": "Stack: React, TypeScript"
    }
  ],
  "educations": [
    {
      "degree": "B.S. in Computer Science | University Name",
      "bullets": []
    }
  ],
  "skills": [
    {
      "title": "Core Skills",
      "items": "TypeScript, JavaScript, Python"
    }
  ]
}
CRITICAL INSTRUCTION: Return ONLY the JSON block. Do not include any markdown formatting like \`\`\`json. Return raw, valid, minified JSON only.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      }
    });

    let text = response.text || "";
    let cleanJson = text.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
    }
    cleanJson = cleanJson.trim();

    try {
      const parsedData = JSON.parse(cleanJson);
      return NextResponse.json({ success: true, data: parsedData });
    } catch (parseErr: any) {
      console.error("Failed to parse JSON response from Gemini:", text);
      return NextResponse.json({ 
         success: false, 
         error: "AI did not return valid JSON. The profile might be private or unreachable.",
         rawText: text 
       }, { status: 500 });
    }

  } catch (err: any) {
    console.error("Error in Gemini LinkedIn parse:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
