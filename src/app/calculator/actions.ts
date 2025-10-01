
'use server';

import { getData } from '@/services/firestore';

export async function getProducts() {
  const { data, error } = await getData('led_products', 'manufacturer');
  return { data, error };
}
