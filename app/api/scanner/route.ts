import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import pdfParse from 'pdf-parse';
import { enforceRateLimit } from '@/lib/rateLimit';
import { getPostHogClient } from '@/lib/posthog-server';
import { runAtsAudit } from '@/lib/agent-rez';

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce Rate Limiting.
    // Note: this route no longer calls an LLM, so the guest limit here is
    // now protecting against scraping/abuse of PDF parsing rather than AI
    // spend — worth revisiting if it should be a separate, looser limit.
    const { errorResponse, ip } = await enforceRateLimit(req);

    if (errorResponse) {
      return errorResponse;
    }

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

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json(
        { error: 'Could not extract enough text from that PDF. Try a text-based (non-scanned) resume.' },
        { status: 422 }
      );
    }

    // Deterministic, reproducible scan — same resume + JD always yields the same result.
    const audit = runAtsAudit(resumeText, jobDescription);

    // Fire server-side PostHog completion event
    const posthogClient = getPostHogClient();
    if (posthogClient) {
      posthogClient.capture({
        distinctId: ip,
        event: 'scanner_completed',
        properties: {
          score: audit.score,
          keywordCoverage: audit.keywordCoverage,
          missingKeywordCount: audit.missingKeywords.length,
        },
      });
      await posthogClient.shutdown();
    }

    return NextResponse.json({
      score: audit.score,
      keywordCoverage: audit.keywordCoverage,
      matchedKeywords: audit.matchedKeywords,
      missingKeywords: audit.missingKeywords,
      sectionChecks: audit.sectionChecks,
      metricsScore: audit.metricsScore,
      verbScore: audit.verbScore,
      weakVerbsFound: audit.weakVerbsFound,
      resumeText,
    });
  } catch (error: any) {
    console.error('Error scanning resume:', error);
    return NextResponse.json(
      { error: 'Failed to process resume and job description.' },
      { status: 500 }
    );
  }
}
