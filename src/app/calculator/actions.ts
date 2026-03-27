
'use server';

import { getLedProducts } from '@/services/supabase';

export async function getProducts() {
  const { data, error } = await getLedProducts();
  return { data, error };
}
