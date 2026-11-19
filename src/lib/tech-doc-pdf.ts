import type { jsPDF as JsPDFType } from "jspdf";
import type { TechDocData, TechDocDevice } from "./tech-doc-saves";

// 11 x 17 landscape in millimeters (jspdf "tabloid" format is portrait 279x432; we
// rotate explicitly for clarity).
const PAGE_W = 431.8; // 17in
const PAGE_H = 279.4; // 11in
const MARGIN = 10;
const BORDER = 0.5;

const INK: [number, number, number] = [17, 24, 39];
const MUTED: [number, number, number] = [75, 85, 99];
const LINE: [number, number, number] = [30, 41, 59];
const HEADER_BACKGROUND: [number, number, number] = [15, 19, 25];
const WHITE: [number, number, number] = [255, 255, 255];
const NODE_BACKGROUND: [number, number, number] = [41, 76, 122];
const NODE_HEADER: [number, number, number] = [49, 89, 140];
const NODE_BORDER: [number, number, number] = [14, 165, 233];
const PORT_COLORS: Record<string, [number, number, number]> = {
  hdmi: [239, 68, 68],
  sdi: [59, 130, 246],
  rj45: [16, 185, 129],
  dvi: [245, 158, 11],
  fiber: [6, 182, 212],
  power: [249, 115, 22],
  custom: [148, 163, 184],
};

export interface TechDocPdfPage {
  label: string;
  title: string;
  screenName: string;
  imageUrls: string[];
  devices: TechDocDevice[];
}

export interface TechDocPdfMeta {
  doc: TechDocData;
  projectName: string;
  logoUrl: string | null;
  pageNumber: number;
  totalPages: number;
}

const LOGO_PATH = "/Untitled_design_(4)-modified.png";

async function loadImageElement(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    if (/^https?:\/\//i.test(url)) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function imageToPngDataUrl(image: HTMLImageElement): string | null {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(image, 0, 0);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

function imageFormatFromUrl(url: string): "JPEG" | "PNG" {
  return /\.jpe?g(?:[?#]|$)/i.test(url) ? "JPEG" : "PNG";
}

function getPdfImageUrl(url: string): string {
  if (!/^https?:\/\//i.test(url)) return url;
  try {
    const target = new URL(url);
    if (typeof window !== "undefined" && target.origin === window.location.origin) return url;
    return `/api/tech-doc-image?url=${encodeURIComponent(target.toString())}`;
  } catch {
    return url;
  }
}

async function loadLogoDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function hexToRgb(value: string, fallback: [number, number, number]): [number, number, number] {
  const match = /^#([0-9a-f]{6})$/i.exec(value);
  if (!match) return fallback;
  return [
    Number.parseInt(match[1].slice(0, 2), 16),
    Number.parseInt(match[1].slice(2, 4), 16),
    Number.parseInt(match[1].slice(4, 6), 16),
  ];
}

function truncateText(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, Math.max(1, maxLength - 1))}…`;
}

function drawDeviceCards(pdf: JsPDFType, devices: TechDocDevice[], left: number, top: number, width: number, height: number): void {
  if (devices.length === 0) return;
  const gap = 4;
  const columns = devices.length;
  const rows = 1;
  const slotWidth = (width - gap) / columns;
  const rowHeight = (height - gap * Math.max(0, rows - 1)) / rows;

  devices.forEach((device, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const xSlot = left + column * (slotWidth + gap);
    const inputs = device.ports.filter((port) => port.direction === "input");
    const outputs = device.ports.filter((port) => port.direction === "output");
    const portRows = Math.max(inputs.length, outputs.length);
    const nodeHeight = Math.min(rowHeight, Math.max(42, 24 + portRows * 4.2));
    const y = top + row * (rowHeight + gap) + (rowHeight - nodeHeight) / 2;
    const nodeRatio = device.width / Math.max(device.height, 70 + portRows * 22);
    const nodeWidth = Math.min(slotWidth, Math.max(42, nodeHeight * nodeRatio));
    const x = xSlot + (slotWidth - nodeWidth) / 2;
    const visibleRows = Math.min(Math.max(1, Math.floor((nodeHeight - 20) / 4.2)), portRows);

    pdf.setFillColor(...NODE_BACKGROUND);
    pdf.setDrawColor(...NODE_BORDER);
    pdf.setLineWidth(0.8);
    pdf.roundedRect(x, y, nodeWidth, nodeHeight, 3, 3, "FD");
    pdf.setFillColor(...NODE_HEADER);
    pdf.roundedRect(x + 0.5, y + 0.5, nodeWidth - 1, 10, 2.5, 2.5, "F");
    pdf.rect(x + 0.5, y + 6, nodeWidth - 1, 4.5, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...WHITE);
    pdf.text(truncateText(device.name, 36), x + 5, y + 6.5);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(5.5);
    pdf.setTextColor(220, 235, 255);
    pdf.text(truncateText(device.type.replaceAll("-", " ").toUpperCase(), 16), x + nodeWidth - 5, y + 6.5, { align: "right" });

    for (let portIndex = 0; portIndex < visibleRows; portIndex++) {
      const portY = y + 17 + portIndex * 4.2;
      const input = inputs[portIndex];
      const output = outputs[portIndex];
      if (input) {
        const color = PORT_COLORS[input.portType] ?? PORT_COLORS.custom;
        pdf.setFillColor(...color);
        pdf.setDrawColor(7, 15, 28);
        pdf.circle(x + 5, portY - 1.3, 1.8, "FD");
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6.5);
        pdf.setTextColor(...WHITE);
        pdf.text(truncateText(input.label, 20), x + 9, portY);
      }
      if (output) {
        const color = PORT_COLORS[output.portType] ?? PORT_COLORS.custom;
        pdf.setFillColor(...color);
        pdf.setDrawColor(7, 15, 28);
        pdf.circle(x + nodeWidth - 5, portY - 1.3, 1.8, "FD");
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6.5);
        pdf.setTextColor(...WHITE);
        pdf.text(truncateText(output.label, 20), x + nodeWidth - 9, portY, { align: "right" });
      }
    }

    if (Math.max(inputs.length, outputs.length) > visibleRows) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(5.5);
      pdf.setTextColor(220, 235, 255);
      pdf.text(`+${Math.max(inputs.length, outputs.length) - visibleRows} more ports`, x + nodeWidth / 2, y + nodeHeight - 4, { align: "center" });
    }
  });
}

export async function buildTechDocPdf(
  jsPdfCtor: typeof JsPDFType,
  pages: TechDocPdfPage[],
  meta: Omit<TechDocPdfMeta, "pageNumber" | "totalPages">
): Promise<JsPDFType | null> {
  if (pages.length === 0) return null;
  const pdf = new jsPdfCtor({
    unit: "mm",
    format: "tabloid",
    orientation: "landscape",
    compress: true,
  });

  const logo = await loadLogoDataUrl(meta.logoUrl ?? LOGO_PATH);
  const logoFormat = logo?.startsWith("data:image/jpeg") ? "JPEG" : "PNG";
  const footerColor = hexToRgb(meta.doc.footerColor, HEADER_BACKGROUND);
  const footerTextColor = hexToRgb(meta.doc.footerTextColor, WHITE);

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (i > 0) pdf.addPage("tabloid", "landscape");

    // Outer border
    pdf.setDrawColor(...LINE);
    pdf.setLineWidth(BORDER);
    pdf.rect(MARGIN, MARGIN, PAGE_W - MARGIN * 2, PAGE_H - MARGIN * 2);

    // Section title, centered at top
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.setTextColor(...INK);
    pdf.text(page.title.normalize("NFKC").toUpperCase(), PAGE_W / 2, MARGIN + 14, {
      align: "center",
    });

    // Image area — bordered frame between title and title block
    const frameTop = MARGIN + 22;
    const frameBottom = PAGE_H - MARGIN - 32;
    const frameLeft = MARGIN + 8;
    const frameRight = PAGE_W - MARGIN - 8;
    const frameW = frameRight - frameLeft;
    const hasDevices = page.devices.length > 0;
    const maxDevicePortRows = Math.max(1, ...page.devices.map((device) => {
      const inputCount = device.ports.filter((port) => port.direction === "input").length;
      const outputCount = device.ports.filter((port) => port.direction === "output").length;
      return Math.max(inputCount, outputCount);
    }));
    const estimatedCardHeight = Math.max(42, 24 + maxDevicePortRows * 4.2);
    const deviceAreaHeight = hasDevices ? 8 + estimatedCardHeight : 0;
    const deviceGap = hasDevices ? 3 : 0;
    const imageFrameBottom = frameBottom - deviceAreaHeight - deviceGap;
    const imageFrameH = imageFrameBottom - frameTop;

    pdf.setDrawColor(...LINE);
    pdf.setLineWidth(0.25);
    pdf.rect(frameLeft, frameTop, frameW, imageFrameH);

    const loadedImages = (await Promise.all(page.imageUrls.map(async (url) => {
      const image = await loadImageElement(getPdfImageUrl(url));
      return image && image.naturalWidth > 0 && image.naturalHeight > 0 ? { image, url } : null;
    }))).filter((entry): entry is { image: HTMLImageElement; url: string } => entry !== null);

    if (loadedImages.length > 0) {
      const gap = 4;
      const pad = 4;
      const columns = loadedImages.length === 1 ? 1 : 2;
      const rows = Math.ceil(loadedImages.length / columns);
      const cellW = (frameW - gap * (columns - 1)) / columns;
      const cellH = (imageFrameH - gap * (rows - 1)) / rows;
      loadedImages.forEach(({ image, url }, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);
        const cellLeft = frameLeft + column * (cellW + gap);
        const cellTop = frameTop + row * (cellH + gap);
        const availW = cellW - pad * 2;
        const availH = cellH - pad * 2;
        const scale = Math.min(availW / image.naturalWidth, availH / image.naturalHeight);
        const drawW = image.naturalWidth * scale;
        const drawH = image.naturalHeight * scale;
        try {
          const imageDataUrl = imageToPngDataUrl(image);
          pdf.addImage(
            imageDataUrl ?? image,
            imageDataUrl ? "PNG" : imageFormatFromUrl(url),
            cellLeft + (cellW - drawW) / 2,
            cellTop + (cellH - drawH) / 2,
            drawW,
            drawH,
            undefined,
            "FAST"
          );
        } catch {
          // Skip images jsPDF cannot embed; the frame stays empty rather than failing the document.
        }
      });
    } else {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(...MUTED);
      pdf.text(page.imageUrls.length > 0 ? "Image could not be loaded." : "No image uploaded for this section.", PAGE_W / 2, (frameTop + imageFrameBottom) / 2, {
        align: "center",
      });
    }

    if (hasDevices) {
      const deviceTop = imageFrameBottom + deviceGap;
      pdf.setDrawColor(...LINE);
      pdf.setLineWidth(0.25);
      pdf.rect(frameLeft, deviceTop, frameW, deviceAreaHeight);
      drawDeviceCards(pdf, page.devices, frameLeft + 4, deviceTop + 4, frameW - 8, deviceAreaHeight - 8);
    }

    // Title block at bottom
    const blockTop = frameBottom;
    const footerHeight = PAGE_H - MARGIN - blockTop;
    pdf.setFillColor(...footerColor);
    pdf.rect(MARGIN + BORDER / 2, blockTop, PAGE_W - MARGIN * 2 - BORDER, footerHeight - BORDER / 2, "F");
    pdf.setDrawColor(...footerTextColor);
    pdf.setLineWidth(0.4);
    pdf.line(MARGIN, blockTop, PAGE_W - MARGIN, blockTop);

    const rowH = footerHeight - 7;
    const footerW = PAGE_W - MARGIN * 2;
    const logoColW = 44;
    const fieldColW = (footerW - logoColW) / 4;
    const cells: { label: string; value: string }[] = [
      { label: "PROJECT", value: meta.projectName },
      { label: "SCREEN", value: page.screenName },
      { label: "REVISION", value: meta.doc.revision || "-" },
      { label: "DATE", value: meta.doc.date || "-" },
    ];
    cells.forEach((cell, idx) => {
      const x = MARGIN + idx * fieldColW;
      pdf.setLineWidth(0.25);
      pdf.line(x, blockTop, x, blockTop + rowH);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(...footerTextColor);
      pdf.text(cell.label, x + 4, blockTop + 7);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10.5);
      pdf.setTextColor(...footerTextColor);
      pdf.text(cell.value.normalize("NFKC"), x + 4, blockTop + 14);
    });

    const logoX = MARGIN + fieldColW * 4;
    pdf.line(logoX, blockTop, logoX, blockTop + rowH);
    pdf.line(MARGIN, blockTop + rowH, PAGE_W - MARGIN, blockTop + rowH);

    if (logo) {
      try {
        const logoSize = Math.min(24, rowH - 2);
        pdf.addImage(
          logo,
          logoFormat,
          logoX + (logoColW - logoSize) / 2,
          blockTop + (rowH - logoSize) / 2,
          logoSize,
          logoSize,
          undefined,
          "FAST"
        );
      } catch {
        // Logo embedding is optional.
      }
    }

    // Footer stays inside the page border, below the title block
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...footerTextColor);
    pdf.text(page.label, MARGIN + 2, PAGE_H - MARGIN - 3);
    pdf.text(
      `Page ${i + 1} of ${pages.length}`,
      PAGE_W - MARGIN - 2,
      PAGE_H - MARGIN - 3,
      { align: "right" }
    );
  }

  return pdf;
}
