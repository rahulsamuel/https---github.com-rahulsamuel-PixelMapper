'use server';

import { addLedProduct } from '@/services/supabase';
import { z } from 'zod';

const formSchema = z.object({
  manufacturer: z.string().min(2, { message: "Manufacturer name must be at least 2 characters." }).transform(val => val.toUpperCase()),
  productName: z.string().min(2, { message: "Product name must be at least 2 characters." }).transform(val => val.toUpperCase()),

  tileWidthPx: z.coerce.number().min(1, { message: "Must be at least 1." }),
  tileHeightPx: z.coerce.number().min(1, { message: "Must be at least 1." }),
  tileWidthMm: z.coerce.number().min(1).optional(),
  tileHeightMm: z.coerce.number().min(1).optional(),
  tileDepthMm: z.coerce.number().positive().optional(),
  tileWeightKg: z.coerce.number().positive().optional(),

  maxPowerConsumption: z.coerce.number().min(0, { message: "Must be non-negative." }),
  avgPowerConsumption: z.coerce.number().min(0).optional(),
  maxPowerWPerSqm: z.coerce.number().positive().optional(),
  avgPowerWPerSqm: z.coerce.number().positive().optional(),

  pixelPitchMm: z.coerce.number().positive().optional(),
  maxBrightness: z.coerce.number().positive().optional(),
  refreshRate: z.coerce.number().positive().optional(),
  grayscaleBit: z.coerce.number().positive().optional(),
  contrastRatio: z.string().optional(),
  colorTemperatureK: z.coerce.number().positive().optional(),
  viewingAngleH: z.coerce.number().positive().optional(),
  viewingAngleV: z.coerce.number().positive().optional(),
  driveMode: z.string().optional(),
  ledType: z.string().optional(),
  ipRating: z.string().optional(),
  certification: z.string().optional(),

  applicationIndoor: z.boolean().default(false),
  applicationOutdoor: z.boolean().default(false),
  applicationFloor: z.boolean().default(false),

  productImageUrl: z.string().optional(),
  specSheetUrl: z.string().optional(),
});

export type FormState = {
  message: string;
  errors?: z.ZodIssue[];
  success: boolean;
};

export async function addProductAction(prevState: FormState, formData: FormData): Promise<FormState> {
  const rawData: Record<string, unknown> = {
    ...Object.fromEntries(formData.entries()),
    applicationIndoor: formData.get('applicationIndoor') === 'true',
    applicationOutdoor: formData.get('applicationOutdoor') === 'true',
    applicationFloor: formData.get('applicationFloor') === 'true',
  };

  const optionalFields = [
    'tileWidthMm','tileHeightMm','tileDepthMm','tileWeightKg',
    'avgPowerConsumption','maxPowerWPerSqm','avgPowerWPerSqm',
    'pixelPitchMm','maxBrightness','refreshRate','grayscaleBit',
    'colorTemperatureK','viewingAngleH','viewingAngleV',
  ];
  for (const field of optionalFields) {
    if (rawData[field] === '' || rawData[field] === undefined) {
      delete rawData[field];
    }
  }

  const validatedFields = formSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.issues,
      message: 'Please correct the errors in the form.',
    };
  }

  const d = validatedFields.data;

  try {
    const { success, error } = await addLedProduct({
      manufacturer: d.manufacturer,
      productName: d.productName,
      tileWidthPx: d.tileWidthPx,
      tileHeightPx: d.tileHeightPx,
      wattsPerTile: d.maxPowerConsumption,
      pixelPitchMm: d.pixelPitchMm,
      tileWidthMm: d.tileWidthMm,
      tileHeightMm: d.tileHeightMm,
      tileDepthMm: d.tileDepthMm,
      tileWeightKg: d.tileWeightKg,
      maxPowerWPerSqm: d.maxPowerWPerSqm,
      avgPowerWPerSqm: d.avgPowerWPerSqm,
      maxBrightnessNit: d.maxBrightness,
      refreshRateHz: d.refreshRate,
      grayscaleBit: d.grayscaleBit,
      contrastRatio: d.contrastRatio,
      colorTemperatureK: d.colorTemperatureK,
      viewingAngleH: d.viewingAngleH,
      viewingAngleV: d.viewingAngleV,
      driveMode: d.driveMode,
      ledType: d.ledType,
      ipRating: d.ipRating,
      certification: d.certification,
      applicationIndoor: d.applicationIndoor,
      applicationOutdoor: d.applicationOutdoor,
      applicationFloor: d.applicationFloor,
      productImageUrl: d.productImageUrl || null,
      specSheetUrl: d.specSheetUrl || null,
    });

    if (!success) throw new Error(error);

    return { success: true, message: 'Product has been added to the database successfully!' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `An unexpected error occurred: ${message}` };
  }
}
