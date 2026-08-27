'use server';

import { createClient } from '@supabase/supabase-js';
import { updateLedProduct } from '@/services/supabase';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const formSchema = z.object({
  manufacturer: z.string().min(2, { message: "Manufacturer name must be at least 2 characters." }).transform(val => val.toUpperCase()),
  productName: z.string().min(2, { message: "Product name must be at least 2 characters." }).transform(val => val.toUpperCase()),

  tileWidthPx: z.coerce.number().min(1, { message: "Must be at least 1." }),
  tileHeightPx: z.coerce.number().min(1, { message: "Must be at least 1." }),
  tileWidthMm: z.coerce.number().min(1, { message: "Must be at least 1." }),
  tileHeightMm: z.coerce.number().min(1, { message: "Must be at least 1." }),

  tileWeightKg: z.coerce.number().min(0.1, { message: "Must be positive." }),

  maxPowerConsumption: z.coerce.number().min(1, { message: "Must be positive." }),
  avgPowerConsumption: z.coerce.number().min(1, { message: "Must be positive." }),

  maxBrightness: z.coerce.number().min(1, { message: "Must be positive." }),
  refreshRate: z.coerce.number().min(1, { message: "Must be positive." }),

  applicationIndoor: z.boolean().default(false),
  applicationOutdoor: z.boolean().default(false),
  applicationFloor: z.boolean().default(false),
});

export type FormState = {
  message: string;
  errors?: z.ZodIssue[];
  success: boolean;
};

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

export async function updateProductAction(productId: string, prevState: FormState, formData: FormData): Promise<FormState> {
  const accessToken = (formData.get('accessToken') as string) || null;
  const isAdmin = await verifyAdmin(accessToken);
  if (!isAdmin) {
    return { success: false, message: 'Access denied. Only admins can update products.' };
  }

  const validatedFields = formSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    applicationIndoor: formData.get('applicationIndoor') === 'true',
    applicationOutdoor: formData.get('applicationOutdoor') === 'true',
    applicationFloor: formData.get('applicationFloor') === 'true',
  });

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.issues,
      message: 'Please correct the errors in the form.',
    };
  }

  try {
    const { success, error } = await updateLedProduct(productId, {
      manufacturer: validatedFields.data.manufacturer,
      productName: validatedFields.data.productName,
      tileWidthPx: validatedFields.data.tileWidthPx,
      tileHeightPx: validatedFields.data.tileHeightPx,
      wattsPerTile: validatedFields.data.maxPowerConsumption,
    });

    if (!success) {
      throw new Error(error || 'Failed to update product');
    }

    return {
      success: true,
      message: 'Product has been updated successfully!',
    };
  } catch (error) {
    console.error('Update product error:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return {
      success: false,
      message: `An unexpected error occurred: ${message}`,
    };
  }
}
