export type SignalFlowExportFormat = "html" | "pdf" | "png";
export type SignalFlowExportMode = "color" | "mono";

const EXPORT_WIDTH = 2000;
const EXPORT_HEIGHT = 1400;
const COLOR_BACKGROUND = "#0a0a0a";
const MONO_BACKGROUND = "#ffffff";
const MONO_INK = "#111827";

const MONO_STYLES = `
[data-export-mode="mono"] div[style*="background-color"] { background-color: #ffffff !important; box-shadow: inset 0 0 0 1.5px ${MONO_INK} !important; }
[data-export-mode="mono"] button[style*="background-color"] { background-color: #ffffff !important; border: 1.5px solid ${MONO_INK} !important; }
[data-export-mode="mono"] [class*="text-white"] { color: ${MONO_INK} !important; }
[data-export-mode="mono"] svg path:not([stroke="transparent"]) { stroke: ${MONO_INK} !important; }
[data-export-mode="mono"] svg text { fill: ${MONO_INK} !important; }
`;

function toFileSlug(title: string): string {
  return title.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "signal-flow";
}

function modeSuffix(mode: SignalFlowExportMode): string {
  return mode === "color" ? "color" : "no-color";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function downloadUrl(url: string, filename: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  downloadUrl(url, filename);
  URL.revokeObjectURL(url);
}

async function renderDiagramPng(source: HTMLElement, mode: SignalFlowExportMode): Promise<string> {
  const background = mode === "color" ? COLOR_BACKGROUND : MONO_BACKGROUND;
  const stage = document.createElement("div");
  stage.style.cssText = `position:fixed;left:-${EXPORT_WIDTH + 200}px;top:0;width:${EXPORT_WIDTH}px;height:${EXPORT_HEIGHT}px;overflow:hidden;pointer-events:none;`;

  const node = source.cloneNode(true) as HTMLElement;
  node.dataset.exportMode = mode;
  node.style.transform = "none";
  node.style.width = `${EXPORT_WIDTH}px`;
  node.style.height = `${EXPORT_HEIGHT}px`;
  node.style.minWidth = `${EXPORT_WIDTH}px`;
  node.style.minHeight = `${EXPORT_HEIGHT}px`;
  node.style.backgroundColor = background;
  if (mode === "mono") {
    const style = document.createElement("style");
    style.textContent = MONO_STYLES;
    node.prepend(style);
  }

  stage.appendChild(node);
  document.body.appendChild(stage);
  try {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const { toPng } = await import("html-to-image");
    return await toPng(node, {
      backgroundColor: background,
      width: EXPORT_WIDTH,
      height: EXPORT_HEIGHT,
      pixelRatio: 2,
      cacheBust: true,
    });
  } finally {
    stage.remove();
  }
}

function buildHtmlDocument(title: string, imageUrl: string, mode: SignalFlowExportMode): string {
  const safeTitle = escapeHtml(title);
  const background = mode === "color" ? "#0a0a0a" : "#ffffff";
  const foreground = mode === "color" ? "#e5e7eb" : "#1f2937";
  const muted = mode === "color" ? "#9ca3af" : "#6b7280";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${safeTitle}</title>
<style>html,body{margin:0;min-width:100%;min-height:100%;background:${background};color:${foreground};font-family:Arial,sans-serif}main{padding:32px;box-sizing:border-box}h1{font-size:20px;margin:0 0 8px}p{color:${muted};font-size:13px;margin:0 0 24px}img{display:block;max-width:100%;height:auto}</style>
</head>
<body><main><h1>${safeTitle}</h1><p>Signal Flow Diagram</p><img src="${imageUrl}" alt="${safeTitle}"></main></body>
</html>`;
}

async function exportHtml(node: HTMLElement, title: string, mode: SignalFlowExportMode): Promise<void> {
  const imageUrl = await renderDiagramPng(node, mode);
  const html = buildHtmlDocument(title, imageUrl, mode);
  const filename = `${toFileSlug(title)}-${modeSuffix(mode)}.html`;
  downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), filename);
}

async function exportPdf(node: HTMLElement, title: string, mode: SignalFlowExportMode): Promise<void> {
  const imageUrl = await renderDiagramPng(node, mode);
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const titleHeight = 10;
  const imageWidth = pageWidth - margin * 2;
  const imageHeight = imageWidth * (EXPORT_HEIGHT / EXPORT_WIDTH);
  const isColor = mode === "color";
  const [bgR, bgG, bgB] = isColor ? [10, 10, 10] : [255, 255, 255];
  const [inkR, inkG, inkB] = isColor ? [229, 231, 235] : [31, 41, 55];

  pdf.setFillColor(bgR, bgG, bgB);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");
  pdf.setTextColor(inkR, inkG, inkB);
  pdf.setFontSize(14);
  pdf.text(title, margin, margin + 4);
  pdf.addImage(imageUrl, "PNG", margin, margin + titleHeight, imageWidth, Math.min(imageHeight, pageHeight - margin * 2 - titleHeight));
  pdf.save(`${toFileSlug(title)}-${modeSuffix(mode)}.pdf`);
}

async function exportPng(node: HTMLElement, title: string, mode: SignalFlowExportMode): Promise<void> {
  const imageUrl = await renderDiagramPng(node, mode);
  downloadUrl(imageUrl, `${toFileSlug(title)}-${modeSuffix(mode)}.png`);
}

export async function downloadSignalFlow(
  format: SignalFlowExportFormat,
  mode: SignalFlowExportMode,
  node: HTMLElement,
  title: string
): Promise<void> {
  const safeTitle = title.trim() || "Signal Flow Diagram";
  if (format === "html") return exportHtml(node, safeTitle, mode);
  if (format === "pdf") return exportPdf(node, safeTitle, mode);
  return exportPng(node, safeTitle, mode);
}
