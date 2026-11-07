import { PDFDocument, PDFFont, PDFPage, PDFImage, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";

export type ReceiptPdfData = {
  receipt_number: string;
  customer_email: string | null;
  items: { manufacturer: string; product_name: string }[];
  product_fee_cents: number;
  processing_fee_cents: number;
  total_cents: number;
  date: string;
};

export const BUSINESS_NAME = "MapMyLED";
export const BUSINESS_TAGLINE = "by PixlVision";
export const BUSINESS_ADDRESS = [
  "4480 South Cobb Drive Southeast Suite H # 621",
  "Smyrna, GA 30080",
  "United States",
];
export const LOGO_URL = "https://mapmyled.com/MapMyLED_wordmark_transparent.png";
export const PRODUCT_FEE_CENTS = 299;

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const LEFT = 56;
const RIGHT = 556;
const CONTENT_BOTTOM = 700;
const INK = rgb(0.07, 0.07, 0.07);
const MUTED = rgb(0.42, 0.42, 0.42);
const RULE = rgb(0.85, 0.85, 0.85);

export function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function toWinAnsi(value: string): string {
  return value.replace(/[^\x20-\x7e]/g, "?");
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 3)}...` : value;
}

async function loadLogo(doc: PDFDocument): Promise<PDFImage | null> {
  try {
    const res = await fetch(LOGO_URL);
    if (!res.ok) return null;
    return await doc.embedPng(new Uint8Array(await res.arrayBuffer()));
  } catch {
    return null;
  }
}

export async function buildReceiptPdf(receipt: ReceiptPdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const logo = await loadLogo(doc);

  const pages: PDFPage[] = [];
  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  pages.push(page);
  let top = 0;

  const newPage = () => {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    pages.push(page);
    top = 56;
  };
  const ensureSpace = (height: number) => {
    if (top + height > CONTENT_BOTTOM) newPage();
  };
  const y = (t: number) => PAGE_HEIGHT - t;

  const write = (
    x: number,
    t: number,
    size: number,
    value: string,
    opts: { bold?: boolean; muted?: boolean; align?: "left" | "right" } = {},
  ) => {
    const font: PDFFont = opts.bold ? bold : regular;
    const text = toWinAnsi(value);
    const width = font.widthOfTextAtSize(text, size);
    const px = opts.align === "right" ? x - width : x;
    page.drawText(text, { x: px, y: y(t) - size, size, font, color: opts.muted ? MUTED : INK });
  };
  const rule = (t: number, left = LEFT) => {
    page.drawLine({ start: { x: left, y: y(t) }, end: { x: RIGHT, y: y(t) }, thickness: 0.75, color: RULE });
  };

  top = 56;
  write(LEFT, top, 28, "Receipt", { bold: true });

  if (logo) {
    const width = 150;
    const height = (logo.height / logo.width) * width;
    page.drawImage(logo, { x: RIGHT - width, y: y(top) - height + 8, width, height });
  } else {
    write(RIGHT, top, 20, BUSINESS_NAME, { bold: true, align: "right" });
  }

  top = 116;
  const meta: [string, string][] = [
    ["Receipt number", receipt.receipt_number],
    ["Date paid", receipt.date],
  ];
  for (const [label, value] of meta) {
    write(LEFT, top, 10, label, { bold: true });
    write(LEFT + 100, top, 10, value);
    top += 16;
  }

  top = 186;
  write(LEFT, top, 11, BUSINESS_NAME, { bold: true });
  write(LEFT + 100, top, 10, BUSINESS_TAGLINE, { muted: true });
  BUSINESS_ADDRESS.forEach((line, i) => write(LEFT, top + 18 + i * 14, 10, line));

  if (receipt.customer_email) {
    write(340, top, 11, "Bill to", { bold: true });
    write(340, top + 18, 10, receipt.customer_email);
  }

  top = 296;
  write(LEFT, top, 18, `${formatMoney(receipt.total_cents)} paid on ${receipt.date}`, { bold: true });

  top = 340;
  write(LEFT, top, 9, "Description", { muted: true });
  write(412, top, 9, "Qty", { muted: true, align: "right" });
  write(486, top, 9, "Unit price", { muted: true, align: "right" });
  write(RIGHT, top, 9, "Amount", { muted: true, align: "right" });
  top += 16;
  rule(top);
  top += 12;

  for (const item of receipt.items) {
    ensureSpace(38);
    write(LEFT, top, 10, "LED product listing fee");
    write(412, top, 10, "1", { align: "right" });
    write(486, top, 10, formatMoney(PRODUCT_FEE_CENTS), { align: "right" });
    write(RIGHT, top, 10, formatMoney(PRODUCT_FEE_CENTS), { align: "right" });
    write(LEFT, top + 15, 9, truncate(`${item.manufacturer} ${item.product_name}`, 70), { muted: true });
    top += 38;
  }

  ensureSpace(60);
  write(LEFT, top, 10, "Card processing fee");
  write(412, top, 10, "1", { align: "right" });
  write(486, top, 10, formatMoney(receipt.processing_fee_cents), { align: "right" });
  write(RIGHT, top, 10, formatMoney(receipt.processing_fee_cents), { align: "right" });
  top += 24;
  rule(top, 340);
  top += 12;

  const totals: [string, string, boolean][] = [
    ["Subtotal", formatMoney(receipt.product_fee_cents + receipt.processing_fee_cents), false],
    ["Total", formatMoney(receipt.total_cents), false],
    ["Amount paid", formatMoney(receipt.total_cents), true],
  ];
  for (const [label, value, isBold] of totals) {
    write(340, top, 10, label, { bold: isBold });
    write(RIGHT, top, 10, value, { bold: isBold, align: "right" });
    top += 18;
  }

  top += 28;
  ensureSpace(130);
  write(LEFT, top, 14, "Payment history", { bold: true });
  top += 30;
  write(LEFT, top, 9, "Payment method", { muted: true });
  write(250, top, 9, "Date", { muted: true });
  write(440, top, 9, "Amount paid", { muted: true, align: "right" });
  write(RIGHT, top, 9, "Receipt number", { muted: true, align: "right" });
  top += 16;
  rule(top);
  top += 12;
  write(LEFT, top, 10, "Card (Stripe)");
  write(250, top, 10, receipt.date);
  write(440, top, 10, formatMoney(receipt.total_cents), { align: "right" });
  write(RIGHT, top, 10, receipt.receipt_number, { align: "right" });

  pages.forEach((p, index) => {
    page = p;
    rule(728);
    write(LEFT, 740, 8, "Thank you for your purchase. Questions? Visit mapmyled.com/contact", { muted: true });
    write(RIGHT, 740, 8, `Page ${index + 1} of ${pages.length}`, { muted: true, align: "right" });
  });

  return await doc.save();
}
