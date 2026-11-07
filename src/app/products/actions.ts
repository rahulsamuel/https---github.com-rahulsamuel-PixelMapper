'use server';

import { deleteLedProduct } from '@/services/supabase';
import { getSessionUser } from '@/lib/supabase/session-user';

export async function deleteProductAction(productId: string, formData: FormData): Promise<{ success: boolean; message: string }> {
  const accessToken = (formData.get('accessToken') as string) || null;
  const sessionUser = await getSessionUser(accessToken);
  if (!sessionUser || !accessToken) {
    return { success: false, message: 'Please sign in to delete products.' };
  }
  const { success, error } = await deleteLedProduct(productId, accessToken);
  if (!success) return { success: false, message: `Failed to delete: ${error}` };
  return { success: true, message: 'Product deleted.' };
}
