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
export const ICON_URL = "https://mapmyled.com/MapMyLED_app_icon%20copy%202.png";
export const WORDMARK_URL = "https://mapmyled.com/MapMyLED_wordmark_transparent%20copy%202.png";
export const HEADER_BACKGROUND_HEX = "#101219";
export const PRODUCT_FEE_CENTS = 299;

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const HEADER_HEIGHT = 96;
const LEFT = 56;
const RIGHT = 556;
const CONTENT_BOTTOM = 700;
const INK = rgb(0.07, 0.07, 0.07);
const MUTED = rgb(0.42, 0.42, 0.42);
const RULE = rgb(0.85, 0.85, 0.85);
const HEADER_BG = rgb(16 / 255, 18 / 255, 25 / 255);

export function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function toWinAnsi(value: string): string {
  return value.replace(/[^\x20-\x7e]/g, "?");
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 3)}...` : value;
}

async function loadImage(doc: PDFDocument, url: string): Promise<PDFImage | null> {
  try {
    const res = await fetch(url);
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
  const [icon, wordmark] = await Promise.all([loadImage(doc, ICON_URL), loadImage(doc, WORDMARK_URL)]);

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
    opts: { bold?: boolean; muted?: boolean; white?: boolean; align?: "left" | "right" } = {},
  ) => {
    const font: PDFFont = opts.bold ? bold : regular;
    const text = toWinAnsi(value);
    const width = font.widthOfTextAtSize(text, size);
    const px = opts.align === "right" ? x - width : x;
    const color = opts.white ? rgb(1, 1, 1) : opts.muted ? MUTED : INK;
    page.drawText(text, { x: px, y: y(t) - size, size, font, color });
  };
  const rule = (t: number, left = LEFT) => {
    page.drawLine({ start: { x: left, y: y(t) }, end: { x: RIGHT, y: y(t) }, thickness: 0.75, color: RULE });
  };

  page.drawRectangle({ x: 0, y: y(HEADER_HEIGHT), width: PAGE_WIDTH, height: HEADER_HEIGHT, color: HEADER_BG });
  const iconSize = 44;
  const wordmarkHeight = 34;
  const wordmarkWidth = wordmark ? (wordmark.width / wordmark.height) * wordmarkHeight : 0;
  const logoGap = 8;
  const logosWidth = (icon ? iconSize : 0) + (icon && wordmark ? logoGap : 0) + wordmarkWidth;
  let logoX = RIGHT - logosWidth;
  if (icon) {
    page.drawImage(icon, { x: logoX, y: y(HEADER_HEIGHT / 2) - iconSize / 2, width: iconSize, height: iconSize });
    logoX += iconSize + logoGap;
  }
  if (wordmark) {
    page.drawImage(wordmark, { x: logoX, y: y(HEADER_HEIGHT / 2) - wordmarkHeight / 2, width: wordmarkWidth, height: wordmarkHeight });
  }
  if (!icon && !wordmark) {
    write(RIGHT, HEADER_HEIGHT / 2 - 10, 20, BUSINESS_NAME, { bold: true, white: true, align: "right" });
  }

  top = 128;
  write(LEFT, top, 28, "Receipt", { bold: true });

  top = 176;
  const meta: [string, string][] = [
    ["Receipt number", receipt.receipt_number],
    ["Date paid", receipt.date],
  ];
  for (const [label, value] of meta) {
    write(LEFT, top, 10, label, { bold: true });
    write(LEFT + 100, top, 10, value);
    top += 16;
  }

  top = 236;
  write(LEFT, top, 11, BUSINESS_NAME, { bold: true });
  write(LEFT + 100, top, 10, BUSINESS_TAGLINE, { muted: true });
  BUSINESS_ADDRESS.forEach((line, i) => write(LEFT, top + 18 + i * 14, 10, line));

  if (receipt.customer_email) {
    write(340, top, 11, "Bill to", { bold: true });
    write(340, top + 18, 10, receipt.customer_email);
  }

  top = 330;
  write(LEFT, top, 18, `${formatMoney(receipt.total_cents)} paid on ${receipt.date}`, { bold: true });

  top = 374;
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
    ensureSpace(20);
    write(340, top, 10, label, { bold: isBold });
    write(RIGHT, top, 10, value, { bold: isBold, align: "right" });
    top += 18;
  }

  const footerTop = PAGE_HEIGHT - 72;
  pages.forEach((p, index) => {
    page = p;
    page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: 72, color: HEADER_BG });
    write(LEFT, footerTop + 26, 8, "Thank you for your purchase. Questions? Visit mapmyled.com/contact", { white: true });
    write(RIGHT, footerTop + 26, 8, `Page ${index + 1} of ${pages.length}`, { white: true, align: "right" });
  });

  return await doc.save();
}
