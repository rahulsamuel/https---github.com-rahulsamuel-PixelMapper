'use server';

import { getProcessors } from '@/services/supabase';

export async function getProcessorsAction() {
  return getProcessors();
}
