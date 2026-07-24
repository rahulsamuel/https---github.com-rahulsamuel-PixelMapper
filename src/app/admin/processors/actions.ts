'use server';

import { addProcessor, updateProcessor, deleteProcessor } from '@/services/supabase';
import type { ProcessorData } from '@/services/supabase';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const schema = z.object({
  manufacturer: z.string().min(2).transform(v => v.trim()),
  modelName: z.string().min(1).transform(v => v.trim()),
  totalPixelCapacity: z.coerce.number().min(0),
  outputPortCount: z.coerce.number().min(1),
  pixelsPerPort: z.coerce.number().min(0),
  baseRefreshRateHz: z.coerce.number().min(1).default(60),
  maxInputResolutionW: z.coerce.number().positive().optional(),
  maxInputResolutionH: z.coerce.number().positive().optional(),
  inputTypes: z.string().optional(),
  rackUnits: z.coerce.number().min(1).default(2),
  weightKg: z.coerce.number().positive().optional(),
  powerWatts: z.coerce.number().positive().optional(),
  powerInput: z.string().optional(),
  depthMm: z.coerce.number().positive().optional(),
  widthMm: z.coerce.number().positive().optional(),
  heightMm: z.coerce.number().positive().optional(),
  notes: z.string().optional(),
  specSheetUrl: z.string().url().optional().or(z.literal('')),
  productImageUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

export type ProcessorFormState = { message: string; success: boolean; errors?: z.ZodIssue[] };

function rawFromFormData(formData: FormData): Record<string, unknown> {
  const raw: Record<string, unknown> = { ...Object.fromEntries(formData.entries()) };
  raw.isActive = formData.get('isActive') === 'true';
  const optionals = [
    'maxInputResolutionW','maxInputResolutionH','weightKg','powerWatts',
    'depthMm','widthMm','heightMm',
  ];
  for (const f of optionals) {
    if (raw[f] === '' || raw[f] === undefined) delete raw[f];
  }
  for (const f of ['inputTypes','notes','powerInput','specSheetUrl','productImageUrl']) {
    if (raw[f] === '') delete raw[f];
  }
  return raw;
}

export async function addProcessorAction(
  _prev: ProcessorFormState,
  formData: FormData
): Promise<ProcessorFormState> {
  const validated = schema.safeParse(rawFromFormData(formData));
  if (!validated.success) {
    return { success: false, errors: validated.error.issues, message: 'Please correct the errors.' };
  }
  const d = validated.data;
  const payload: ProcessorData = {
    manufacturer: d.manufacturer,
    modelName: d.modelName,
    totalPixelCapacity: d.totalPixelCapacity,
    outputPortCount: d.outputPortCount,
    pixelsPerPort: d.pixelsPerPort,
    baseRefreshRateHz: d.baseRefreshRateHz,
    maxInputResolutionW: d.maxInputResolutionW ?? null,
    maxInputResolutionH: d.maxInputResolutionH ?? null,
    inputTypes: d.inputTypes ?? null,
    rackUnits: d.rackUnits,
    weightKg: d.weightKg ?? null,
    powerWatts: d.powerWatts ?? null,
    powerInput: d.powerInput ?? null,
    depthMm: d.depthMm ?? null,
    widthMm: d.widthMm ?? null,
    heightMm: d.heightMm ?? null,
    notes: d.notes ?? null,
    specSheetUrl: d.specSheetUrl || null,
    productImageUrl: d.productImageUrl || null,
    isActive: d.isActive,
  };
  const { success, error } = await addProcessor(payload);
  if (!success) return { success: false, message: `Failed to save: ${error}` };
  revalidatePath('/admin/processors');
  return { success: true, message: 'Processor added successfully.' };
}

export async function updateProcessorAction(
  id: string,
  _prev: ProcessorFormState,
  formData: FormData
): Promise<ProcessorFormState> {
  const validated = schema.safeParse(rawFromFormData(formData));
  if (!validated.success) {
    return { success: false, errors: validated.error.issues, message: 'Please correct the errors.' };
  }
  const d = validated.data;
  const { success, error } = await updateProcessor(id, {
    manufacturer: d.manufacturer,
    modelName: d.modelName,
    totalPixelCapacity: d.totalPixelCapacity,
    outputPortCount: d.outputPortCount,
    pixelsPerPort: d.pixelsPerPort,
    baseRefreshRateHz: d.baseRefreshRateHz,
    maxInputResolutionW: d.maxInputResolutionW ?? null,
    maxInputResolutionH: d.maxInputResolutionH ?? null,
    inputTypes: d.inputTypes ?? null,
    rackUnits: d.rackUnits,
    weightKg: d.weightKg ?? null,
    powerWatts: d.powerWatts ?? null,
    powerInput: d.powerInput ?? null,
    depthMm: d.depthMm ?? null,
    widthMm: d.widthMm ?? null,
    heightMm: d.heightMm ?? null,
    notes: d.notes ?? null,
    specSheetUrl: d.specSheetUrl || null,
    productImageUrl: d.productImageUrl || null,
    isActive: d.isActive,
  });
  if (!success) return { success: false, message: `Failed to update: ${error}` };
  revalidatePath('/admin/processors');
  return { success: true, message: 'Processor updated.' };
}

export async function deleteProcessorAction(id: string): Promise<{ success: boolean; message: string }> {
  const { success, error } = await deleteProcessor(id);
  if (!success) return { success: false, message: `Failed to delete: ${error}` };
  revalidatePath('/admin/processors');
  return { success: true, message: 'Processor deleted.' };
}
