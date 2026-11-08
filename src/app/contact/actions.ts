
'use server';

import { headers } from 'next/headers';
import { submitContactMessage } from '@/services/supabase';
import { z } from 'zod';
import { emailField, plainText } from '@/lib/validation/fields';
import { clientIp, isRateLimited } from '@/lib/rate-limit';

const formSchema = z.object({
  name: plainText(100, 2),
  email: emailField,
  message: plainText(5000, 10),
});

export type FormState = {
  message: string;
  errors?: {
    name?: string[];
    email?: string[];
    message?: string[];
  };
  success: boolean;
};

export async function submitContactForm(prevState: FormState, formData: FormData): Promise<FormState> {
  if (await isRateLimited('contact', clientIp(await headers()), 5, 600)) {
    return { success: false, message: 'Too many messages sent. Please wait a few minutes and try again.' };
  }

  const validatedFields = formSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Please correct the errors in the form.',
    };
  }
  
  const { name, email, message } = validatedFields.data;

  try {
    const { success, error } = await submitContactMessage({
      name,
      email,
      message,
    });

    if (!success) {
      throw new Error(error || 'Failed to submit message');
    }

    return {
      success: true,
      message: 'Your message has been sent successfully!',
    };
  } catch (error) {
    console.error('Contact form submission error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    };
  }
}
