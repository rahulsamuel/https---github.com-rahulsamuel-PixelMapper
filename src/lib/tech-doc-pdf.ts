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

export interface TechDocPdfPage {
  label: string;
  title: string;
  screenName: string;
  imageUrl: string | null;
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
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
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
  const columns = 2;
  const rows = Math.ceil(devices.length / columns);
  const cardWidth = (width - gap) / columns;
  const cardHeight = (height - gap * Math.max(0, rows - 1)) / rows;
  const maxPortsPerSide = Math.max(1, Math.floor((cardHeight - 15) / 4));

  devices.forEach((device, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = left + column * (cardWidth + gap);
    const y = top + row * (cardHeight + gap);
    const deviceColor = hexToRgb(device.color, MUTED);
    const inputs = device.ports.filter((port) => port.direction === "input");
    const outputs = device.ports.filter((port) => port.direction === "output");

    pdf.setDrawColor(...LINE);
    pdf.setLineWidth(0.25);
    pdf.rect(x, y, cardWidth, cardHeight);
    pdf.setFillColor(241, 245, 249);
    pdf.rect(x, y, cardWidth, 9, "F");
    pdf.setFillColor(...deviceColor);
    pdf.rect(x, y, 2, cardHeight, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...INK);
    pdf.text(truncateText(device.name, 42), x + 5, y + 6);

    const groups = [
      { label: "INPUTS", ports: inputs },
      { label: "OUTPUTS", ports: outputs },
    ];
    const columnWidth = (cardWidth - 10) / 2;
    groups.forEach((group, groupIndex) => {
      const groupX = x + 5 + groupIndex * (columnWidth + 2);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(5.5);
      pdf.setTextColor(...MUTED);
      pdf.text(group.label, groupX, y + 14);
      group.ports.slice(0, maxPortsPerSide).forEach((port, portIndex) => {
        const portY = y + 19 + portIndex * 4;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6.5);
        pdf.setTextColor(...INK);
        pdf.text(truncateText(port.label, 22), groupX, portY);
        pdf.setDrawColor(...LINE);
        pdf.setLineWidth(0.2);
        pdf.line(groupX + columnWidth - 7, portY - 1.2, groupX + columnWidth, portY - 1.2);
      });
      if (group.ports.length > maxPortsPerSide) {
        pdf.setFontSize(5.5);
        pdf.setTextColor(...MUTED);
        pdf.text(`+${group.ports.length - maxPortsPerSide} more`, groupX, y + cardHeight - 3);
      }
    });
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
    const deviceRows = Math.ceil(page.devices.length / 2);
    const maxDevicePorts = Math.max(1, ...page.devices.map((device) => device.ports.length));
    const estimatedCardHeight = Math.min(30, Math.max(18, 8 + maxDevicePorts * 2.2));
    const deviceAreaHeight = hasDevices ? Math.min(84, Math.max(42, 10 + deviceRows * estimatedCardHeight + Math.max(0, deviceRows - 1) * 4)) : 0;
    const deviceGap = hasDevices ? 3 : 0;
    const imageFrameBottom = frameBottom - deviceAreaHeight - deviceGap;
    const imageFrameH = imageFrameBottom - frameTop;

    pdf.setDrawColor(...LINE);
    pdf.setLineWidth(0.25);
    pdf.rect(frameLeft, frameTop, frameW, imageFrameH);

    if (page.imageUrl) {
      const img = await loadImageElement(page.imageUrl);
      if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
        const pad = 4;
        const availW = frameW - pad * 2;
        const availH = imageFrameH - pad * 2;
        const scale = Math.min(availW / img.naturalWidth, availH / img.naturalHeight);
        const drawW = img.naturalWidth * scale;
        const drawH = img.naturalHeight * scale;
        try {
          pdf.addImage(
            img,
            "PNG",
            frameLeft + (frameW - drawW) / 2,
            frameTop + (imageFrameH - drawH) / 2,
            drawW,
            drawH,
            undefined,
            "FAST"
          );
        } catch {
          // Skip images jsPDF cannot embed; the frame stays empty rather than failing the document.
        }
      } else {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);
        pdf.setTextColor(...MUTED);
        pdf.text("Image could not be loaded.", PAGE_W / 2, (frameTop + imageFrameBottom) / 2, {
          align: "center",
        });
      }
    } else {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(...MUTED);
      pdf.text("No image uploaded for this section.", PAGE_W / 2, (frameTop + imageFrameBottom) / 2, {
        align: "center",
      });
    }

    if (hasDevices) {
      const deviceTop = imageFrameBottom + deviceGap;
      pdf.setDrawColor(...LINE);
      pdf.setLineWidth(0.25);
      pdf.rect(frameLeft, deviceTop, frameW, deviceAreaHeight);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(...INK);
      pdf.text("SIGNAL FLOW DEVICES", frameLeft + 4, deviceTop + 7);
      drawDeviceCards(pdf, page.devices, frameLeft + 4, deviceTop + 11, frameW - 8, deviceAreaHeight - 14);
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
