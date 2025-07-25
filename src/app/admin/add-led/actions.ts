
'use server';

import { z } from 'zod';
import { addData } from '@/services/firestore';

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

export async function addProductAction(prevState: FormState, formData: FormData): Promise<FormState> {
    
  const validatedFields = formSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    applicationIndoor: formData.has('applicationIndoor'),
    applicationOutdoor: formData.has('applicationOutdoor'),
    applicationFloor: formData.has('applicationFloor'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors as any,
      message: 'Please correct the errors in the form.',
    };
  }
  
  try {
    const { error } = await addData('led_products', validatedFields.data);

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: 'Product has been added successfully!',
    };
  } catch (error) {
    console.error('Add product error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    };
  }
}
