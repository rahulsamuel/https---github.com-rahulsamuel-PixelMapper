'use server';

import { deleteLedProduct } from '@/services/supabase';

export async function deleteProduct(productId: string, _formData: FormData): Promise<{ success: boolean; message: string }> {
  const { success, error } = await deleteLedProduct(productId);
  if (!success) return { success: false, message: `Failed to delete: ${error}` };
  return { success: true, message: 'Product deleted.' };
}
