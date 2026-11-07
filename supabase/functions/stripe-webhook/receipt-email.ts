import { BUSINESS_NAME, BUSINESS_TAGLINE, formatMoney, LOGO_URL, PRODUCT_FEE_CENTS, type ReceiptPdfData } from "./receipt-pdf.ts";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function itemRows(receipt: ReceiptPdfData): string {
  const products = receipt.items.map(item => `
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid #ececec;font-size:14px;color:#1a1a1a;">
              LED product listing fee<br>
              <span style="font-size:12px;color:#6b6b6b;">${escapeHtml(`${item.manufacturer} ${item.product_name}`)}</span>
            </td>
            <td align="right" style="padding:12px 0;border-bottom:1px solid #ececec;font-size:14px;color:#1a1a1a;white-space:nowrap;">${formatMoney(PRODUCT_FEE_CENTS)}</td>
          </tr>`);
  products.push(`
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid #ececec;font-size:14px;color:#1a1a1a;">Card processing fee</td>
            <td align="right" style="padding:12px 0;border-bottom:1px solid #ececec;font-size:14px;color:#1a1a1a;white-space:nowrap;">${formatMoney(receipt.processing_fee_cents)}</td>
          </tr>`);
  return products.join("");
}

export function buildReceiptEmail(receipt: ReceiptPdfData): { subject: string; html: string; text: string } {
  const total = formatMoney(receipt.total_cents);
  const subject = `Your MapMyLED receipt ${receipt.receipt_number}`;

  const html = `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#1c1c1c;font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#1c1c1c;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;">
            <tr>
              <td style="padding:0 0 20px;" align="center">
                <img src="${LOGO_URL}" alt="${BUSINESS_NAME}" height="36" style="display:block;height:36px;border:0;">
                <p style="margin:8px 0 0;font-size:12px;color:#9a9a9a;">${BUSINESS_TAGLINE}</p>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;border-radius:12px;padding:28px;">
                <p style="margin:0;font-size:14px;color:#6b6b6b;">Receipt from ${BUSINESS_NAME}</p>
                <p style="margin:8px 0 4px;font-size:36px;font-weight:bold;color:#1a1a1a;">${total}</p>
                <p style="margin:0;font-size:13px;color:#6b6b6b;">Paid on ${escapeHtml(receipt.date)}</p>
              </td>
            </tr>
            <tr><td style="height:16px;"></td></tr>
            <tr>
              <td style="background:#ffffff;border-radius:12px;padding:28px;">
                <p style="margin:0 0 4px;font-size:16px;font-weight:bold;color:#1a1a1a;">Receipt ${escapeHtml(receipt.receipt_number)}</p>
                <p style="margin:0 0 16px;font-size:13px;color:#6b6b6b;">Your PDF receipt is attached to this email.</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${itemRows(receipt)}
                  <tr>
                    <td style="padding:14px 0 0;font-size:15px;font-weight:bold;color:#1a1a1a;">Total</td>
                    <td align="right" style="padding:14px 0 0;font-size:15px;font-weight:bold;color:#1a1a1a;white-space:nowrap;">${total}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0 0;font-size:14px;color:#1a1a1a;">Amount paid</td>
                    <td align="right" style="padding:8px 0 0;font-size:14px;color:#1a1a1a;white-space:nowrap;">${total}</td>
                  </tr>
                </table>
                <p style="margin:24px 0 0;">
                  <a href="https://mapmyled.com/receipts" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;font-size:14px;padding:10px 18px;border-radius:8px;">View receipts</a>
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:28px 8px 0;font-size:13px;line-height:20px;color:#d0d0d0;">
                Questions? Visit our <a href="https://mapmyled.com/contact" style="color:#ffffff;font-weight:bold;">contact page</a>.<br>
                Payments are processed securely by Stripe.
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:16px 8px 0;font-size:12px;color:#8a8a8a;">${BUSINESS_NAME} ${BUSINESS_TAGLINE}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const lines = receipt.items.map(
    item => `LED product listing fee (${item.manufacturer} ${item.product_name}): ${formatMoney(PRODUCT_FEE_CENTS)}`,
  );
  lines.push(`Card processing fee: ${formatMoney(receipt.processing_fee_cents)}`);
  const text = [
    `Receipt from ${BUSINESS_NAME} ${BUSINESS_TAGLINE}`,
    `${total} paid on ${receipt.date}`,
    "",
    `Receipt ${receipt.receipt_number}`,
    ...lines,
    `Total: ${total}`,
    "",
    "Your PDF receipt is attached. You can also view receipts at https://mapmyled.com/receipts",
  ].join("\n");

  return { subject, html, text };
}

export async function sendReceiptEmail(apiKey: string, receipt: ReceiptPdfData, pdf: Uint8Array): Promise<void> {
  const { subject, html, text } = buildReceiptEmail(receipt);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "MapMyLED <receipts@mapmyled.com>",
      to: [receipt.customer_email],
      subject,
      html,
      text,
      attachments: [{ filename: `${receipt.receipt_number}.pdf`, content: toBase64(pdf) }],
    }),
  });
  if (!res.ok) throw new Error(`Resend responded ${res.status}: ${await res.text()}`);
}
