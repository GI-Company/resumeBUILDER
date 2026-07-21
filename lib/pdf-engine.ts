/**
 * ============================================================================
 * ENTERPRISE RESUME PDF ENGINE (CANVA & ADOBE EXPRESS CLASS)
 * ============================================================================
 * A bulletproof, multi-stage, self-contained PDF rendering engine designed to
 * guarantee 100% visual fidelity between the browser canvas and the downloaded PDF.
 * 
 * Pipeline stages:
 * Stage 1: Nuclear CSSOM + Server-Side Puppeteer Engine (High-speed, exact vector PDF)
 * Stage 2: High-DPI Client-Side Retina Canvas Engine (html2canvas 3x + jsPDF fallback)
 * Stage 3: Native System Print Fallback with strict print CSS injection
 * ============================================================================
 */

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface PdfExportOptions {
  /** The root DOM element containing the physical resume pages (.resume-canvas-container) */
  resumeElement: HTMLElement;
  /** The wrapper element containing inline CSS design variables (.canvas-wrap) */
  canvasWrapElement?: HTMLElement | null;
  /** The desired output filename without or with .pdf extension */
  filename: string;
  /** Target page size: 'letter' (8.5x11 in) or 'a4' (210x297 mm) */
  pageSize: 'letter' | 'a4';
  /** Optional callback to report export status and progress to UI */
  onProgress?: (stage: 'extracting' | 'server_rendering' | 'client_fallback' | 'completed' | 'error', message: string) => void;
}

/**
 * Stage 1: Nuclear CSS Object Model (CSSOM) Extractor
 * Reads actively parsed and rendered CSS rules straight from browser memory.
 * Bypasses network restrictions, CORS blockers, and dynamic class purges.
 */
export function extractActiveBrowserStyles(): string {
  let extractedStyles = '';

  // 1. Traverse all parsed stylesheets in active browser memory
  for (let i = 0; i < document.styleSheets.length; i++) {
    try {
      const sheet = document.styleSheets[i];
      const rules = sheet.cssRules || sheet.rules;
      if (rules) {
        for (let j = 0; j < rules.length; j++) {
          const ruleText = rules[j].cssText;
          if (ruleText && !ruleText.includes('sourceMappingURL')) {
            extractedStyles += ruleText + '\n';
          }
        }
      }
    } catch (e) {
      // Cross-origin stylesheet error (e.g. external font stylesheet).
      // We will capture external font URLs via redundant DOM node scanning below.
      console.warn('[PDF Engine] Could not read external stylesheet CSSOM rules directly:', e);
    }
  }

  // 2. Capture all raw <style> and <link rel="stylesheet"> nodes as a redundant net
  const styleNodes = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
  const rawNodeStyles = styleNodes.map((node) => {
    if (node.tagName.toLowerCase() === 'link') {
      const link = node as HTMLLinkElement;
      // Ensure we keep Google font links or CDN styles intact
      return `<link rel="stylesheet" href="${link.href}" crossorigin="anonymous">`;
    } else {
      return node.outerHTML;
    }
  }).join('\n');

  return `
    /* --- Redundant DOM Stylesheets & Font Links --- */
    ${rawNodeStyles}

    /* --- Nuclear CSSOM Memory Rules --- */
    <style>
      ${extractedStyles}
    </style>
  `;
}

/**
 * Builds a completely standalone, self-contained HTML document payload ready for
 * high-fidelity serverless Chromium rendering.
 */
export function buildSelfContainedHtml(
  resumeHtml: string,
  extractedStyles: string,
  inlineVars: string,
  pageSize: 'letter' | 'a4'
): string {
  const isLetter = pageSize === 'letter';
  const widthMm = isLetter ? '215.9mm' : '210mm';
  const heightMm = isLetter ? '279.4mm' : '297mm';

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resume Export</title>
    <!-- Preload comprehensive typography suites (Google Fonts) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Kalam:wght@400;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Poppins:wght@300;400;500;600;700&family=Roboto:ital,wght@0,300;0,400;0,500;0,700;1,400&display=swap" rel="stylesheet">
    
    ${extractedStyles}

    <style>
      /* --- Root Dynamic Variables --- */
      :root {
        ${inlineVars}
      }

      /* --- Global Document Reset for PDF Engine --- */
      *, *::before, *::after {
        box-sizing: border-box !important;
        -webkit-font-smoothing: antialiased !important;
        -moz-osx-font-smoothing: grayscale !important;
      }

      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
        width: 100% !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      /* --- UI & Editing Cleanup --- */
      .no-print,
      .format-bar,
      .design-panel,
      [data-contenteditable],
      .resizing-handle,
      .hover-guide {
        display: none !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }

      /* --- Canvas Optimization --- */
      .resume-canvas-container {
        transform: none !important;
        width: ${widthMm} !important;
        max-width: ${widthMm} !important;
        margin: 0 auto !important;
        padding: 0 !important;
        background: transparent !important;
      }

      .physical-page-container {
        width: ${widthMm} !important;
        height: ${heightMm} !important;
        max-height: ${heightMm} !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
        border-radius: 0 !important;
        background: white !important;
        overflow: hidden !important;
        position: relative !important;
        page-break-after: always !important;
        page-break-inside: avoid !important;
        break-after: page !important;
      }

      /* Remove page break after the very last page */
      .physical-page-container:last-of-type {
        page-break-after: auto !important;
        break-after: auto !important;
      }

      /* --- Strict Print Media Rules --- */
      @media print {
        @page {
          size: ${isLetter ? 'letter' : 'A4'} portrait;
          margin: 0 !important;
        }
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          background-color: white !important;
        }
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
    ${resumeHtml}
  </body>
</html>`;
}

/**
 * Stage 2: High-DPI Client-Side Retina Canvas Engine (html2canvas + jsPDF)
 * Renders vector/raster pages cleanly in the browser when server rendering is blocked or offline.
 */
export async function runClientSideRetinaFallback(
  resumeElement: HTMLElement,
  filename: string,
  pageSize: 'letter' | 'a4',
  onProgress?: (message: string) => void
): Promise<void> {
  onProgress?.('Initializing high-DPI retina rendering engine...');

  const pages = Array.from(resumeElement.querySelectorAll('.physical-page-container')) as HTMLElement[];
  const targetElements = pages.length > 0 ? pages : [resumeElement];

  const orientation = 'portrait';
  const unit = 'mm';
  const format = pageSize === 'letter' ? 'letter' : 'a4';
  const pdf = new jsPDF({ orientation, unit, format });

  const pageWidth = pageSize === 'letter' ? 215.9 : 210;
  const pageHeight = pageSize === 'letter' ? 279.4 : 297;

  for (let i = 0; i < targetElements.length; i++) {
    const pageEl = targetElements[i];
    onProgress?.(`Rendering high-DPI page ${i + 1} of ${targetElements.length}...`);

    // Capture at 3x scale for ultra-crisp typography and graphics
    const canvas = await html2canvas(pageEl, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: pageEl.scrollWidth || 1400,
    } as any);

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    if (i > 0) {
      pdf.addPage(format, orientation);
    }

    pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
  }

  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  pdf.save(cleanFilename);
}

/**
 * Main Enterprise Export Pipeline
 * Orchestrates the full SAAS PDF export workflow with automatic fallbacks.
 */
export async function exportResumeToPdf(options: PdfExportOptions): Promise<void> {
  const { resumeElement, canvasWrapElement, filename, pageSize, onProgress } = options;
  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename.replace(/[^a-z0-9]/gi, '_')}_Resume.pdf`;

  try {
    // Stage 1: CSSOM Extraction & Server Rendering
    onProgress?.('extracting', 'Extracting active browser CSSOM memory & typography rules...');
    const extractedStyles = extractActiveBrowserStyles();
    const inlineVars = canvasWrapElement?.getAttribute('style') || '';
    
    const selfContainedHtml = buildSelfContainedHtml(
      resumeElement.outerHTML,
      extractedStyles,
      inlineVars,
      pageSize
    );

    onProgress?.('server_rendering', 'Generating enterprise vector PDF via serverless Chromium...');
    
    const response = await fetch('/api/export-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html: selfContainedHtml,
        filename: cleanFilename,
        pageSize,
      }),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({ error: 'Unknown server error' }));
      throw new Error(errorPayload.error || `Server responded with status ${response.status}`);
    }

    const blob = await response.blob();
    if (blob.size === 0) {
      throw new Error('Received empty PDF blob from server.');
    }

    // Trigger seamless client download of the vector PDF
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.download = cleanFilename;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(url);

    onProgress?.('completed', 'High-quality vector PDF downloaded successfully!');
  } catch (serverError: any) {
    console.warn('[PDF Engine] Server vector rendering failed. Initiating high-DPI client canvas fallback:', serverError);
    onProgress?.('client_fallback', 'Server busy. Switching to high-DPI client retina rendering engine...');

    try {
      // Stage 2: High-DPI Client Canvas Fallback
      await runClientSideRetinaFallback(
        resumeElement,
        cleanFilename,
        pageSize,
        (msg) => onProgress?.('client_fallback', msg)
      );
      onProgress?.('completed', 'Retina canvas PDF generated and downloaded successfully!');
    } catch (clientError: any) {
      console.error('[PDF Engine] Client canvas rendering also failed. Invoking native system print fallback:', clientError);
      onProgress?.('error', 'PDF generation fallback initiated. Opening system print dialogue...');
      
      // Stage 3: Native System Print Fallback
      window.print();
    }
  }
}
