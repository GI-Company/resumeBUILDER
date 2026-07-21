import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export interface ExportOptions {
  elementId: string;
  filename: string;
  scaleFactor?: number;
}

export async function exportHighDpiFallback({
  elementId,
  filename,
  scaleFactor = 3,
}: ExportOptions): Promise<void> {
  const targetElement = document.getElementById(elementId);
  if (!targetElement) {
    throw new Error(`Target DOM element #${elementId} not found.`);
  }

  await document.fonts.ready;

  const originalHeightStyle = targetElement.style.height;
  targetElement.style.height = "auto";

  const options = {
    scale: scaleFactor,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
  };

  try {
    const renderedCanvas = await html2canvas(targetElement, options);

    targetElement.style.height = originalHeightStyle;

    const canvasWidth = renderedCanvas.width;
    const canvasHeight = renderedCanvas.height;

    const pageRealWidth = 210;
    const pageRealHeight = 297;
    const renderHeight = (canvasHeight * pageRealWidth) / canvasWidth;

    const pdfDocument = new jsPDF("p", "mm", "a4");
    let remainingHeight = renderHeight;
    let verticalOffset = 0;

    const base64Image = renderedCanvas.toDataURL("image/png");

    while (remainingHeight > 0) {
      pdfDocument.addImage(
        base64Image,
        "PNG",
        0,
        verticalOffset,
        pageRealWidth,
        renderHeight,
        undefined,
        "FAST"
      );

      remainingHeight -= pageRealHeight;
      verticalOffset -= pageRealHeight;

      if (remainingHeight > 0) {
        pdfDocument.addPage();
      }
    }

    pdfDocument.save(filename);
  } catch (error) {
    targetElement.style.height = originalHeightStyle;
    throw error;
  }
}

export async function requestPdfExportWithFallback(
  htmlContent: string,
  elementId: string,
  filename: string
): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9500);

  try {
    const response = await fetch("/api/export-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html: htmlContent }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Serverless rendering error: HTTP ${response.status}`);
    }

    const pdfBlob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(pdfBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = downloadUrl;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.warn(
      "Serverless rendering aborted or failed. Swapping to high-DPI client fallback:",
      error.message
    );
    await exportHighDpiFallback({
      elementId,
      filename,
      scaleFactor: 3,
    });
  }
}
