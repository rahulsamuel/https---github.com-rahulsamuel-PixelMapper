import { formatCents, PRODUCT_FEE_CENTS } from '@/lib/product-checkout';
import { formatReceiptDate, type Receipt } from '@/lib/receipts';

export const BUSINESS_NAME = 'MapMyLED by PixlVision';
export const BUSINESS_ADDRESS = [
  '4480 South Cobb Drive Southeast Suite H # 621',
  'Smyrna, GA 30080',
  'United States',
];

export async function downloadReceiptPdf(receipt: Receipt): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const left = 56;
  const right = 556;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(BUSINESS_NAME, left, 64);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  BUSINESS_ADDRESS.forEach((line, i) => doc.text(line, left, 82 + i * 13));

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('RECEIPT', right, 64, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Receipt number: ${receipt.receipt_number}`, right, 84, { align: 'right' });
  doc.text(`Date: ${formatReceiptDate(receipt.paid_at ?? receipt.created_at)}`, right, 97, { align: 'right' });
  doc.text(`Status: ${receipt.status === 'paid' ? 'Paid' : receipt.status}`, right, 110, { align: 'right' });
  if (receipt.customer_email) {
    doc.text(`Billed to: ${receipt.customer_email}`, left, 122);
  }

  let y = 150;
  doc.line(left, y, right, y);
  y += 22;
  doc.setFont('helvetica', 'bold');
  doc.text('Description', left, y);
  doc.text('Amount', right, y, { align: 'right' });
  y += 8;
  doc.line(left, y, right, y);
  y += 18;

  doc.setFont('helvetica', 'normal');
  for (const item of receipt.items) {
    const lines = doc.splitTextToSize(
      `LED product listing fee: ${item.manufacturer} ${item.product_name}`,
      380
    ) as string[];
    doc.text(lines, left, y);
    doc.text(formatCents(PRODUCT_FEE_CENTS), right, y, { align: 'right' });
    y += lines.length * 14 + 6;
  }

  y += 6;
  doc.line(left + 300, y, right, y);
  y += 18;
  doc.text('Product fees', left + 300, y);
  doc.text(formatCents(receipt.product_fee_cents), right, y, { align: 'right' });
  y += 16;
  doc.text('Card processing fee', left + 300, y);
  doc.text(formatCents(receipt.processing_fee_cents), right, y, { align: 'right' });
  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.text('Total paid', left + 300, y);
  doc.text(formatCents(receipt.total_cents), right, y, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text('Thank you for your purchase.', left, 740);

  doc.save(`${receipt.receipt_number}.pdf`);
}
