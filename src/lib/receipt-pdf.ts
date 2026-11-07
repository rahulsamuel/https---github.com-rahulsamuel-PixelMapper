'use client';

import { supabase } from '@/lib/supabase/client';
import type { Receipt } from '@/lib/receipts';

export const BUSINESS_NAME = 'MapMyLED by PixlVision';
export const BUSINESS_ADDRESS = [
  '4480 South Cobb Drive Southeast Suite H # 621',
  'Smyrna, GA 30080',
  'United States',
];

export async function downloadReceiptPdf(receipt: Receipt): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Please sign in to download receipts.');

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/stripe-webhook?receipt_id=${encodeURIComponent(receipt.id)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Download failed (${res.status})`);
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = `${receipt.receipt_number}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
