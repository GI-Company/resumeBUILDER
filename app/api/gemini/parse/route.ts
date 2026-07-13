import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Initialize Gemini SDK with recommended user-agent for AI Studio Build
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid resume text" },
        { status: 400 }
      );
    }

    const prompt = `
You are an expert resume parser specialized in parsing clinical, nursing, and professional resumes into a high-fidelity editor state.
Parse the following raw resume text and return a structured JSON response matching the schema.

Raw Resume Text:
"""
${text}
"""

Instructions:
1. Extract the candidate's full name, clinical titles, and credentials (e.g. 'HANNA S. NIX, BSN, RN').
2. Format the contact line with clean pipes as separators (e.g. 'City, State | Phone | Email').
3. Summarize or copy the professional summary / bio section.
4. Extract licenses, certifications, and credentials into the 'licenses' list. Format each license string nicely in HTML using <b> tags for emphasis (e.g. '<b>RN License</b> — Georgia (Expires: Jan 2026)'). Ensure all credentials, certifications, and state licenses from the text are captured.
5. Extract clinical skills and competencies into structured skill categories. Group related items together under descriptive titles.
6. Extract all professional experiences. For each experience, parse out clinical metadata such as Charting System(s), Facility Type, Position Type, Units Floated To, Position Specialty, Trauma Level, Charge Nurse Experience, Nurse-to-Patient Ratio, and Hospital Bed Count. Format these clinical metrics beautifully as a 2-column CSS grid inside the 'meta' field, using this exact HTML structure:
   <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] mt-2 bg-black/[0.03] p-3 rounded-lg border border-[var(--hairline)]">
     <div><b>Charting System(s):</b> EPIC</div>
     <div><b>Facility Type:</b> Short Term Acute Care</div>
     ...
   </div>
   Include only the metrics that are actually present or can be reasonably inferred from the experience text. Ensure the other description text goes into the bullets.
7. Extract education entries, including school, degree, honors, and graduation dates.

All ID fields must be unique strings (e.g., 'lic-1', 'sk-1', 'exp-1', 'edu-1'...). Use random or sequential string IDs.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "Full name in uppercase, e.g. 'HANNA S. NIX, BSN, RN'",
            },
            contactLine: {
              type: Type.STRING,
              description: "Formatted contact details line.",
            },
            summary: {
              type: Type.STRING,
              description: "Professional summary paragraph.",
            },
            licenses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  text: {
                    type: Type.STRING,
                    description:
                      "HTML-enabled license text, e.g. '<b>BLS Certification</b> — AHA (Expires May 2027)'",
                  },
                },
                required: ["id", "text"],
              },
            },
            skills: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  items: { type: Type.STRING },
                },
                required: ["id", "title", "items"],
              },
            },
            experiences: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: {
                    type: Type.STRING,
                    description: "Job title and company details.",
                  },
                  date: { type: Type.STRING },
                  bullets: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        text: { type: Type.STRING },
                      },
                      required: ["id", "text"],
                    },
                  },
                  meta: {
                    type: Type.STRING,
                    description:
                      "Bespoke grid of clinical metadata metrics in HTML.",
                  },
                },
                required: ["id", "title", "date", "bullets", "meta"],
              },
            },
            educations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  degree: { type: Type.STRING },
                  bullets: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        text: { type: Type.STRING },
                      },
                      required: ["id", "text"],
                    },
                  },
                },
                required: ["id", "degree", "bullets"],
              },
            },
          },
          required: [
            "name",
            "contactLine",
            "summary",
            "licenses",
            "skills",
            "experiences",
            "educations",
          ],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("Gemini parse route error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse resume text" },
      { status: 500 }
    );
  }
}
