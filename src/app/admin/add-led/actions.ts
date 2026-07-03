'use server';

// Re-export from the canonical actions file so both /add-led and /admin/add-led share the same logic
export { addProductAction, type FormState } from '@/app/add-led/actions';
