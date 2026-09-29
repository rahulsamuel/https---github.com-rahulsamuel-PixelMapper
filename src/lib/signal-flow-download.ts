import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

const EXPORT_WIDTH = 2000;
const EXPORT_HEIGHT = 1400;

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadText(content: string, filename: string): void {
  downloadBlob(new Blob([content], { type: "text/html;charset=utf-8" }), filename);
}

function cloneForExport(node: HTMLElement, lightBackground: boolean): HTMLElement {
  const clone = node.cloneNode(true) as HTMLElement;
  clone.style.transform = "scale(1)";
  clone.style.width = `${EXPORT_WIDTH}px`;
  clone.style.height = `${EXPORT_HEIGHT}px`;
  clone.style.minWidth = `${EXPORT_WIDTH}px`;
  clone.style.minHeight = `${EXPORT_HEIGHT}px`;
  clone.style.backgroundColor = lightBackground ? "#ffffff" : "#0a0a0a";

  if (lightBackground) {
    clone.querySelectorAll<HTMLElement>('[data-export-label="port"]').forEach((label) => {
      label.style.color = "#1f2937";
    });
  }

  clone.style.position = "fixed";
  clone.style.left = "-10000px";
  clone.style.top = "0";
  clone.style.zIndex = "-1";
  document.body.appendChild(clone);
  return clone;
}

async function renderDiagram(node: HTMLElement, lightBackground: boolean): Promise<string> {
  const clone = cloneForExport(node, lightBackground);
  try {
    return await toPng(clone, {
      backgroundColor: lightBackground ? "#ffffff" : "#0a0a0a",
      width: EXPORT_WIDTH,
      height: EXPORT_HEIGHT,
      pixelRatio: 2,
      cacheBust: true,
    });
  } finally {
    clone.remove();
  }
}

export async function downloadSignalFlowHtml(node: HTMLElement, title: string): Promise<void> {
  const imageUrl = await renderDiagram(node, false);
  const safeTitle = title.trim() || "Signal Flow Diagram";
  const filename = `${safeTitle.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "signal-flow"}.html`;
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${safeTitle.replace(/[&<>\"]/g, "")}</title>
<style>html,body{margin:0;min-width:100%;min-height:100%;background:#0a0a0a;color:#e5e7eb;font-family:Arial,sans-serif}main{padding:32px;box-sizing:border-box}h1{font-size:20px;margin:0 0 8px}p{color:#9ca3af;font-size:13px;margin:0 0 24px}img{display:block;max-width:100%;height:auto}</style>
</head>
<body><main><h1>${safeTitle.replace(/[&<>\"]/g, "")}</h1><p>Signal Flow Diagram</p><img src="${imageUrl}" alt="${safeTitle.replace(/[&<>\"]/g, "")}"></main></body>
</html>`;
  downloadText(html, filename);
}

export async function downloadSignalFlowPdf(node: HTMLElement, title: string): Promise<void> {
  const imageUrl = await renderDiagram(node, true);
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const titleHeight = 10;
  const imageWidth = pageWidth - margin * 2;
  const imageHeight = imageWidth * (EXPORT_HEIGHT / EXPORT_WIDTH);

  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");
  pdf.setTextColor(31, 41, 55);
  pdf.setFontSize(14);
  pdf.text(title.trim() || "Signal Flow Diagram", margin, margin + 4);
  pdf.addImage(imageUrl, "PNG", margin, margin + titleHeight, imageWidth, Math.min(imageHeight, pageHeight - margin * 2 - titleHeight));
  pdf.save(`${(title.trim() || "signal-flow").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "signal-flow"}.pdf`);
}
