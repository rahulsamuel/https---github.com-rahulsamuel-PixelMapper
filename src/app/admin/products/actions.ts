
'use server';

import { deleteData } from '@/services/firestore';
import { revalidatePath } from 'next/cache';

export async function deleteProduct(productId: string) {
  try {
    await deleteData('led_products', productId);
    revalidatePath('/admin/products');
    revalidatePath('/calculator');
  } catch (error) {
    console.error('Failed to delete product:', error);
    return {
      message: 'Failed to delete product.',
    };
  }
}
