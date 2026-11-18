import type { jsPDF as JsPDFType } from "jspdf";
import type { TechDocData } from "./tech-doc-saves";

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
}

export interface TechDocPdfMeta {
  doc: TechDocData;
  projectName: string;
  pageNumber: number;
  totalPages: number;
}

const LOGO_PATH = "/MapMyLED_wordmark_transparent.png";

async function loadImageElement(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function loadLogoDataUrl(pdf: JsPDFType): Promise<string | null> {
  try {
    const res = await fetch(LOGO_PATH);
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

  const logo = await loadLogoDataUrl(pdf);

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
    const frameH = frameBottom - frameTop;

    pdf.setDrawColor(...LINE);
    pdf.setLineWidth(0.25);
    pdf.rect(frameLeft, frameTop, frameW, frameH);

    if (page.imageUrl) {
      const img = await loadImageElement(page.imageUrl);
      if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
        const pad = 4;
        const availW = frameW - pad * 2;
        const availH = frameH - pad * 2;
        const scale = Math.min(availW / img.naturalWidth, availH / img.naturalHeight);
        const drawW = img.naturalWidth * scale;
        const drawH = img.naturalHeight * scale;
        try {
          pdf.addImage(
            img,
            "PNG",
            frameLeft + (frameW - drawW) / 2,
            frameTop + (frameH - drawH) / 2,
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
        pdf.text("Image could not be loaded.", PAGE_W / 2, (frameTop + frameBottom) / 2, {
          align: "center",
        });
      }
    } else {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(...MUTED);
      pdf.text("No image uploaded for this section.", PAGE_W / 2, (frameTop + frameBottom) / 2, {
        align: "center",
      });
    }

    // Title block at bottom
    const blockTop = frameBottom;
    const footerHeight = PAGE_H - MARGIN - blockTop;
    pdf.setFillColor(...HEADER_BACKGROUND);
    pdf.rect(MARGIN + BORDER / 2, blockTop, PAGE_W - MARGIN * 2 - BORDER, footerHeight - BORDER / 2, "F");
    pdf.setDrawColor(...WHITE);
    pdf.setLineWidth(0.4);
    pdf.line(MARGIN, blockTop, PAGE_W - MARGIN, blockTop);

    const rowH = 13;
    const colW = (PAGE_W - MARGIN * 2) / 4;
    const cells: { label: string; value: string }[] = [
      { label: "PROJECT", value: meta.projectName },
      { label: "SCREEN", value: page.screenName },
      { label: "REVISION", value: meta.doc.revision || "-" },
      { label: "DATE", value: meta.doc.date || "-" },
    ];
    cells.forEach((cell, idx) => {
      const x = MARGIN + idx * colW;
      pdf.setLineWidth(0.25);
      pdf.line(x, blockTop, x, blockTop + rowH * 2);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(...WHITE);
      pdf.text(cell.label, x + 4, blockTop + 5);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10.5);
      pdf.setTextColor(...WHITE);
      pdf.text(cell.value.normalize("NFKC"), x + 4, blockTop + 11);
    });
    pdf.line(MARGIN, blockTop + rowH, PAGE_W - MARGIN, blockTop + rowH);
    pdf.line(MARGIN, blockTop + rowH * 2, PAGE_W - MARGIN, blockTop + rowH * 2);

    // Logo in the block, to the right of the title block
    if (logo) {
      try {
        pdf.addImage(logo, "PNG", PAGE_W - MARGIN - 40, blockTop + rowH + 1.5, 36, 0, undefined, "FAST");
      } catch {
        // Logo embedding is optional.
      }
    }

    // Footer stays inside the page border, below the title block
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...WHITE);
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
