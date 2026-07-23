
'use server';

import { deleteLedProduct } from '@/services/supabase';
import { revalidatePath } from 'next/cache';

export async function deleteProduct(productId: string, _formData: FormData): Promise<void> {
  try {
    const { success } = await deleteLedProduct(productId);
    if (!success) {
      throw new Error('Failed to delete product');
    }
    revalidatePath('/admin/products');
    revalidatePath('/calculator');
  } catch (error) {
    console.error('Failed to delete product:', error);
  }
}
