export type ReceiptPdfData = {
  receipt_number: string;
  customer_email: string | null;
  items: { manufacturer: string; product_name: string }[];
  product_fee_cents: number;
  processing_fee_cents: number;
  total_cents: number;
  date: string;
};

const BUSINESS_NAME = "MapMyLED by PixlVision";
const BUSINESS_ADDRESS = [
  "4480 South Cobb Drive Southeast Suite H # 621",
  "Smyrna, GA 30080",
  "United States",
];
const PRODUCT_FEE_CENTS = 299;
const PAGE_HEIGHT = 792;
const LEFT = 56;
const RIGHT = 556;

function escapePdfText(value: string): string {
  return value
    .replace(/[^\x20-\x7e]/g, "?")
    .replace(/[\\()]/g, match => `\\${match}`);
}

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 3)}...` : value;
}

function assemblePdf(streamBody: string): Uint8Array {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>",
    `<< /Length ${new TextEncoder().encode(streamBody).length} >>\nstream\n${streamBody}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return new TextEncoder().encode(pdf);
}

export function buildReceiptPdf(receipt: ReceiptPdfData): Uint8Array {
  const ops: string[] = [];
  const y = (top: number) => PAGE_HEIGHT - top;

  const text = (x: number, top: number, size: number, value: string, bold = false) => {
    ops.push(`BT /${bold ? "F2" : "F1"} ${size} Tf ${x} ${y(top)} Td (${escapePdfText(value)}) Tj ET`);
  };
  const textRight = (right: number, top: number, size: number, value: string, bold = false) => {
    const width = value.length * size * 0.55;
    text(right - width, top, size, value, bold);
  };
  const rule = (top: number, left = LEFT) => {
    ops.push(`0.8 w ${left} ${y(top)} m ${RIGHT} ${y(top)} l S`);
  };

  text(LEFT, 64, 18, BUSINESS_NAME, true);
  BUSINESS_ADDRESS.forEach((line, i) => text(LEFT, 82 + i * 13, 10, line));

  textRight(RIGHT, 64, 20, "RECEIPT", true);
  textRight(RIGHT, 84, 10, `Receipt number: ${receipt.receipt_number}`);
  textRight(RIGHT, 97, 10, `Date: ${receipt.date}`);
  textRight(RIGHT, 110, 10, "Status: Paid");
  if (receipt.customer_email) {
    text(LEFT, 122, 10, `Billed to: ${receipt.customer_email}`);
  }

  rule(150);
  text(LEFT, 172, 10, "Description", true);
  textRight(RIGHT, 172, 10, "Amount", true);
  rule(180);

  let top = 198;
  for (const item of receipt.items) {
    text(LEFT, top, 10, truncate(`LED product listing fee: ${item.manufacturer} ${item.product_name}`, 80));
    textRight(RIGHT, top, 10, formatMoney(PRODUCT_FEE_CENTS));
    top += 20;
  }

  top += 6;
  rule(top, LEFT + 300);
  top += 18;
  text(LEFT + 300, top, 10, "Product fees");
  textRight(RIGHT, top, 10, formatMoney(receipt.product_fee_cents));
  top += 16;
  text(LEFT + 300, top, 10, "Card processing fee");
  textRight(RIGHT, top, 10, formatMoney(receipt.processing_fee_cents));
  top += 18;
  text(LEFT + 300, top, 10, "Total paid", true);
  textRight(RIGHT, top, 10, formatMoney(receipt.total_cents), true);

  text(LEFT, 740, 9, "Thank you for your purchase.");

  return assemblePdf(ops.join("\n"));
}
