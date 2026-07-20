import { NextRequest, NextResponse } from 'next/server';
import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

// Maximize Vercel timeout for the function to allow Puppeteer to spin up and render
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { html, filename = 'resume.pdf', pageSize = 'letter' } = await request.json();

    if (!html) {
      return NextResponse.json({ error: 'HTML content required' }, { status: 400 });
    }

    // Determine if running locally or on Vercel
    const isLocal = process.env.NODE_ENV === 'development';

    const getResolvedArgs = async (): Promise<string[]> => {
      if (isLocal) {
        const res = puppeteerCore.defaultArgs();
        return Array.isArray(res) ? res : await (res as any);
      } else {
        const res = chromium.args;
        return Array.isArray(res) ? res : await (res as any);
      }
    };
    const args: string[] = await getResolvedArgs();

    const getResolvedPath = async (): Promise<string> => {
      if (isLocal) {
        return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
      } else {
        const res = chromium.executablePath();
        return typeof res === 'string' ? res : await (res as any);
      }
    };
    const executablePath: string = await getResolvedPath();

    const browser = await puppeteerCore.launch({
      args,
      defaultViewport: (chromium as any).defaultViewport || { width: 1400, height: 1800 },
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();

    // Load the HTML and wait until all network requests (fonts, images) are finished
    await page.setContent(html, {
      waitUntil: ['domcontentloaded', 'networkidle0'] as any,
    });

    // Explicitly wait for web fonts to finish applying
    await page.evaluate(() => document.fonts.ready);

    const pdfBuffer = await page.pdf({
      format: pageSize === 'a4' ? 'A4' : 'Letter',
      printBackground: true,
      margin: {
        top: '0in',
        bottom: '0in',
        left: '0in',
        right: '0in',
      },
      preferCSSPageSize: true,
    });

    await browser.close();

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
