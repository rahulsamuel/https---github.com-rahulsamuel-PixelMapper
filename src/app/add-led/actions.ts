'use server';

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

export async function addProductAction(prevState: FormState, formData: FormData): Promise<FormState> {
  const accessToken = (formData.get('accessToken') as string) || null;

  const isAdmin = await verifyAdmin(accessToken);
  if (!isAdmin) {
    return { success: false, message: 'Access denied. Only admins can add products.' };
  }

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
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    const { error } = await client.from("led_products").insert({
      manufacturer: d.manufacturer,
      product_name: d.productName,
      tile_width_px: d.tileWidthPx,
      tile_height_px: d.tileHeightPx,
      watts_per_tile: d.maxPowerConsumption,
      pixel_pitch_mm: d.pixelPitchMm ?? null,
      tile_width_mm: d.tileWidthMm ?? null,
      tile_height_mm: d.tileHeightMm ?? null,
      tile_depth_mm: d.tileDepthMm ?? null,
      tile_weight_kg: d.tileWeightKg ?? null,
      max_power_w_per_sqm: d.maxPowerWPerSqm ?? null,
      avg_power_w_per_sqm: d.avgPowerWPerSqm ?? null,
      max_brightness_nit: d.maxBrightness ?? null,
      refresh_rate_hz: d.refreshRate ?? null,
      grayscale_bit: d.grayscaleBit ?? null,
      contrast_ratio: d.contrastRatio ?? null,
      color_temperature_k: d.colorTemperatureK ?? null,
      viewing_angle_h: d.viewingAngleH ?? null,
      viewing_angle_v: d.viewingAngleV ?? null,
      drive_mode: d.driveMode ?? null,
      led_type: d.ledType ?? null,
      ip_rating: d.ipRating ?? null,
      certification: d.certification ?? null,
      application_indoor: d.applicationIndoor ?? false,
      application_outdoor: d.applicationOutdoor ?? false,
      application_floor: d.applicationFloor ?? false,
      product_image_url: d.productImageUrl || null,
      spec_sheet_url: d.specSheetUrl || null,
      created_by: (formData.get('createdBy') as string) || null,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Product has been added to the database successfully!' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `An unexpected error occurred: ${message}` };
  }
}
