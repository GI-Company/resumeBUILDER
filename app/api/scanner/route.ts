import { NextResponse } from 'next/server';
// @ts-ignore
import pdfParse from 'pdf-parse';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('resume') as File | null;
    const jobDescription = formData.get('jobDescription') as string | null;

    if (!file || !jobDescription) {
      return NextResponse.json(
        { error: 'Resume file and job description are required.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const pdfData = await pdfParse(buffer);
    const resumeText = pdfData.text;

    const prompt = `You are an expert ATS (Applicant Tracking System) parser and resume reviewer. 
Analyze the following resume against the provided job description.
Return ONLY a valid JSON object containing exactly two keys:
1. "score": an integer between 0 and 100 representing the ATS match score.
2. "flaws": an array of exactly 3 concise strings describing the major keyword or structural gaps.

Job Description:
${jobDescription}

Resume Text:
${resumeText}`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content || '{}';
    const result = JSON.parse(content);

    return NextResponse.json({
      score: result.score || 50,
      flaws: result.flaws || [
        'Missing key industry keywords',
        'Formatting incompatible with standard ATS',
        'Lack of quantified impact metrics',
      ],
    });
  } catch (error: any) {
    console.error('Error scanning resume:', error);
    return NextResponse.json(
      { error: 'Failed to process resume and job description.' },
      { status: 500 }
    );
  }
}
