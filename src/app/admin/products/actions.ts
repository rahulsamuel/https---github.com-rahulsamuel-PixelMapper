'use server';

import { createClient } from '@supabase/supabase-js';
import { deleteLedProduct } from '@/services/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function verifyAdmin(accessToken: string | null): Promise<boolean> {
  if (!accessToken) return false;
  try {
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const { data: { user } } = await client.auth.getUser(accessToken);
    if (!user) return false;
    return user.app_metadata?.['is_admin'] === true;
  } catch {
    return false;
  }
}

export async function deleteProduct(productId: string, _formData: FormData): Promise<{ success: boolean; message: string }> {
  const accessToken = (_formData.get('accessToken') as string) || null;
  const isAdmin = await verifyAdmin(accessToken);
  if (!isAdmin) {
    return { success: false, message: 'Access denied. Only admins can delete products.' };
  }
  const { success, error } = await deleteLedProduct(productId);
  if (!success) return { success: false, message: `Failed to delete: ${error}` };
  return { success: true, message: 'Product deleted.' };
}
