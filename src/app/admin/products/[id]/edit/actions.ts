
'use server';

import { updateData } from '@/services/firestore';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

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

export async function updateProductAction(productId: string, prevState: FormState, formData: FormData): Promise<FormState> {
    
  const validatedFields = formSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    applicationIndoor: formData.get('applicationIndoor') === 'on',
    applicationOutdoor: formData.get('applicationOutdoor') === 'on',
    applicationFloor: formData.get('applicationFloor') === 'on',
  });

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.issues,
      message: 'Please correct the errors in the form.',
    };
  }
  
  try {
    const productData = {
        ...validatedFields.data,
        updatedAt: new Date().toISOString(),
    };

    const { error } = await updateData('led_products', productId, productData);

    if (error) {
      throw new Error(error);
    }
    
    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${productId}/edit`);
    revalidatePath('/calculator');

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
