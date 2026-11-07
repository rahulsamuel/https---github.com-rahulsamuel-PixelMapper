'use client';

import { supabase } from '@/lib/supabase/client';
import { getCachedProducts, setCachedProducts } from '@/lib/data-cache';
import { fetchLedProducts, type LedProduct } from '@/services/supabase';

export async function loadLedProducts(): Promise<{ data: LedProduct[]; error: string | null }> {
  const { data: { session } } = await supabase.auth.getSession();
  const cacheKey = session?.user.id ?? 'anon';
  const cached = getCachedProducts(cacheKey);
  if (cached) return { data: cached, error: null };

  const { data, error } = await fetchLedProducts(supabase, { includeOwner: false });
  if (!error) setCachedProducts(cacheKey, data);
  return { data, error };
}
