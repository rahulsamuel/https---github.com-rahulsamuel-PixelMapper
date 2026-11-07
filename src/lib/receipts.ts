import { supabase } from '@/lib/supabase/client';

export type ReceiptItem = {
  manufacturer: string;
  product_name: string;
  led_product_id: string | null;
};

export type Receipt = {
  id: string;
  receipt_number: string;
  status: string;
  customer_email: string | null;
  items: ReceiptItem[];
  product_fee_cents: number;
  processing_fee_cents: number;
  total_cents: number;
  currency: string;
  paid_at: string | null;
  created_at: string;
};

const RECEIPT_COLUMNS =
  'id, receipt_number, status, customer_email, items, product_fee_cents, processing_fee_cents, total_cents, currency, paid_at, created_at';

export async function fetchReceipts(): Promise<{ data: Receipt[]; error: string | null }> {
  const { data, error } = await supabase
    .from('receipts')
    .select(RECEIPT_COLUMNS)
    .order('created_at', { ascending: false });
  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as Receipt[], error: null };
}

export function formatReceiptDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
