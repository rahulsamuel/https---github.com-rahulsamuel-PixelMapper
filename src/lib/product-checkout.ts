export const PRODUCT_FEE_CENTS = 299;
const CARD_PERCENT_FEE = 0.029;
const CARD_FIXED_FEE_CENTS = 30;

export type CheckoutBreakdown = {
  productCount: number;
  productFeeCents: number;
  processingFeeCents: number;
  totalCents: number;
};

export function calculateCheckoutBreakdown(productCount: number): CheckoutBreakdown {
  const productFeeCents = PRODUCT_FEE_CENTS * productCount;
  const totalCents = Math.ceil((productFeeCents + CARD_FIXED_FEE_CENTS) / (1 - CARD_PERCENT_FEE));
  return {
    productCount,
    productFeeCents,
    processingFeeCents: totalCents - productFeeCents,
    totalCents,
  };
}

export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export async function startProductCheckout(rows: Record<string, unknown>[], accessToken: string): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const res = await fetch(`${supabaseUrl}/functions/v1/create-product-checkout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows, returnUrl: `${window.location.origin}/add-led` }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.url) {
    throw new Error(json?.error || `Could not start checkout (${res.status}).`);
  }
  return json.url as string;
}
