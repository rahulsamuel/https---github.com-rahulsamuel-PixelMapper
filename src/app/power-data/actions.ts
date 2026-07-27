'use server';

import { getProcessors, getLedProducts } from '@/services/supabase';

export async function getProcessorsAction() {
  return getProcessors();
}

export async function getProductsAction() {
  const { data, error } = await getLedProducts();
  return { data, error };
}
