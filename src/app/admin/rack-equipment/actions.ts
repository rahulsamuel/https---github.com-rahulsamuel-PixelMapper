'use server';

import {
  addRackEquipment,
  updateRackEquipment,
  deleteRackEquipment,
  type RackEquipmentData,
} from '@/services/supabase';
import { revalidatePath } from 'next/cache';

export async function createEquipmentAction(data: RackEquipmentData) {
  const result = await addRackEquipment(data);
  if (result.success) revalidatePath('/admin/rack-equipment');
  return result;
}

export async function updateEquipmentAction(id: string, data: Partial<RackEquipmentData>) {
  const result = await updateRackEquipment(id, data);
  if (result.success) revalidatePath('/admin/rack-equipment');
  return result;
}

export async function deleteEquipmentAction(id: string) {
  const result = await deleteRackEquipment(id);
  if (result.success) revalidatePath('/admin/rack-equipment');
  return result;
}
