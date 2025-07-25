
'use server';

import { z } from 'zod';
// import { addData } from '@/services/firestore'; // Removed database call

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
    // The database connection is currently broken.
    // To make the app runnable, this function will log the data instead of saving it.
    console.log("Form data submitted:", validatedFields.data);

    // To re-enable database functionality, you must:
    // 1. Ensure `src/lib/firebase/service-account.ts` contains your valid credentials.
    // 2. Uncomment the `addData` call below and the import at the top of the file.
    // 3. Restore the original content of `src/services/firestore.ts`.
    
    /*
    const { error } = await addData('led_products', validatedFields.data);

    if (error) {
        return {
            success: false,
            message: `Database error: ${error}`,
        };
    }
    */

    return {
      success: true,
      message: 'Product has been added successfully! (Logged to console)',
    };
  } catch (error) {
    console.error('Add product error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    };
  }
}
