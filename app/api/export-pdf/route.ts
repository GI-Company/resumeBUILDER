import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

export const maxDuration = 60;

let cachedExecutablePath: string | null = null;
let downloadPromise: Promise<string> | null = null;

const CHROMIUM_PACK_URL =
  process.env.CHROMIUM_PACK_URL ||
  "https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar";

async function getChromiumExecutable(): Promise<string> {
  const isLocal = process.env.NODE_ENV === "development";
  if (isLocal) {
    return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  }

  if (cachedExecutablePath) {
    return cachedExecutablePath;
  }

  if (!downloadPromise) {
    downloadPromise = chromium
      .executablePath(CHROMIUM_PACK_URL)
      .then((path) => {
        cachedExecutablePath = path;
        return path;
      })
      .catch((err) => {
        downloadPromise = null;
        throw err;
      });
  }

  return downloadPromise;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { html, viewport } = body;

    if (!html || typeof html !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'html' payload in request body." },
        { status: 400 }
      );
    }

    const isProduction =
      process.env.NODE_ENV === "production" ||
      process.env.VERCEL_ENV === "production";
    const executablePath = await getChromiumExecutable();
    const args = isProduction
      ? [
          ...chromium.args,
          "--hide-scrollbars",
          "--disable-web-security",
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--font-render-hinting=none",
        ]
      : ["--no-sandbox", "--disable-setuid-sandbox"];

    const browser = await puppeteerCore.launch({
      args,
      defaultViewport: (chromium as any).defaultViewport || { width: 1400, height: 1800 },
      executablePath,
      headless: (chromium as any).headless ?? true,
    });

    const page = await browser.newPage();

    if (viewport) {
      await page.setViewport({
        width: viewport.width || 1200,
        height: viewport.height || 800,
        deviceScaleFactor: viewport.scale || 2,
      });
    }

    await page.setContent(html, { waitUntil: ["domcontentloaded", "networkidle0"] as any });

    const pdfBuffer = await page.pdf({
      format: "letter",
      printBackground: true,
      preferCSSPageSize: true,
    });

    const pages = await browser.pages();
    for (const openPage of pages) {
      await openPage.close().catch(() => {});
    }
    await browser.close().catch(() => {});

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="export.pdf"',
      },
    });
  } catch (error: any) {
    console.error("[PDF Export Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error rendering PDF." },
      { status: 500 }
    );
  }
}
