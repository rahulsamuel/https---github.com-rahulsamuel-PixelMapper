import type { jsPDF as JsPDFType } from "jspdf";

export interface CalculatorPdfData {
  title: string;
  date: string;
  product: { manufacturer: string; productName: string } | null;
  resolution: string;
  totalPixels: string;
  tileConfig: string;
  aspectRatio: string;
  dimensionsMetric: string;
  dimensionsImperial: string;
  weightMetric: string;
  weightImperial: string;
  powerPerM2: string;
  totalPower: string;
  currentDraw: { label: string; value: string };
}

const PAGE_W = 210;
const MARGIN = 14;
const GAP = 6;
const CARD_RADIUS = 3;
const INK: [number, number, number] = [17, 24, 39];
const MUTED: [number, number, number] = [107, 114, 128];
const BORDER: [number, number, number] = [226, 232, 240];

type Field = { label: string; value: string };

function drawCard(pdf: JsPDFType, x: number, y: number, w: number, h: number, heading: string): number {
  pdf.setDrawColor(...BORDER);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(x, y, w, h, CARD_RADIUS, CARD_RADIUS, "S");
  pdf.setTextColor(...INK);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text(heading, x + 6, y + 9);
  return y + 15;
}

function drawFields(pdf: JsPDFType, x: number, y: number, w: number, fields: Field[], columns = 2): number {
  const colW = (w - 12) / columns;
  let rowY = y;
  fields.forEach((field, i) => {
    const col = i % columns;
    const fx = x + 6 + col * colW;
    if (col === 0 && i > 0) rowY += 13;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(...MUTED);
    pdf.text(field.label, fx, rowY);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10.5);
    pdf.setTextColor(...INK);
    const lines = pdf.splitTextToSize(field.value.normalize("NFKC"), colW - 4) as string[];
    pdf.text(lines, fx, rowY + 5);
  });
  return rowY + 13;
}

export function buildCalculatorPdf(jsPdfCtor: typeof JsPDFType, data: CalculatorPdfData): JsPDFType {
  const pdf = new jsPdfCtor({ unit: "mm", format: "a4", orientation: "portrait" });
  const fullW = PAGE_W - MARGIN * 2;
  const halfW = (fullW - GAP) / 2;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.setTextColor(...INK);
  pdf.text(data.title.normalize("NFKC").toUpperCase(), PAGE_W / 2, 22, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(...MUTED);
  pdf.text(data.date, PAGE_W / 2, 29, { align: "center" });

  const row1Y = 36;
  const productFields: Field[] = [
    { label: "Manufacturer", value: data.product?.manufacturer ?? "-" },
    { label: "Product", value: data.product?.productName ?? "-" },
  ];
  const resFields: Field[] = [
    { label: "Resolution", value: data.resolution },
    { label: "Total Pixels", value: data.totalPixels },
    { label: "Tile Config", value: data.tileConfig },
    { label: "Aspect Ratio", value: data.aspectRatio },
  ];
  const rowOneHeight = 56;
  let y = drawCard(pdf, MARGIN, row1Y, halfW, rowOneHeight, "LED Product");
  drawFields(pdf, MARGIN, y, halfW, productFields);
  y = drawCard(pdf, MARGIN + halfW + GAP, row1Y, halfW, rowOneHeight, "Screen Resolution");
  drawFields(pdf, MARGIN + halfW + GAP, y, halfW, resFields);

  const row2Y = row1Y + rowOneHeight + GAP;
  const dimHeight = 36;
  y = drawCard(pdf, MARGIN, row2Y, halfW, dimHeight, "Physical Dimensions");
  drawFields(pdf, MARGIN, y, halfW, [
    { label: "Metric", value: data.dimensionsMetric },
    { label: "Imperial", value: data.dimensionsImperial },
  ]);
  y = drawCard(pdf, MARGIN + halfW + GAP, row2Y, halfW, dimHeight, "Total Weight");
  drawFields(pdf, MARGIN + halfW + GAP, y, halfW, [
    { label: "Metric", value: data.weightMetric },
    { label: "Imperial", value: data.weightImperial },
  ]);

  const row3Y = row2Y + dimHeight + GAP;
  const powerHeight = 36;
  y = drawCard(pdf, MARGIN, row3Y, fullW, powerHeight, "Power Consumption");
  drawFields(pdf, MARGIN, y, fullW, [
    { label: "Power per m² (Max / Avg)", value: data.powerPerM2 },
    { label: "Total Power (Max / Avg)", value: data.totalPower },
    { label: data.currentDraw.label, value: data.currentDraw.value },
  ], 3);

  return pdf;
}
