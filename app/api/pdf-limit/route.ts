import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkAndLogPdfLimit } from '@/lib/pdfLimit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const checkOnly = body.checkOnly === true;

    const result = await checkAndLogPdfLimit(request, checkOnly);
    
    if (!result.allowed) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: 429 }
      );
    }

    return NextResponse.json({ allowed: true, tier: result.tier });
  } catch (err: any) {
    console.error('Error in PDF limit route:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
