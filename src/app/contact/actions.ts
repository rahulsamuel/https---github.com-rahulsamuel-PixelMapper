
'use server';

import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
});

export async function submitContactForm(prevState: any, formData: FormData) {
  try {
    const parsedData = formSchema.parse({
      name: formData.get('name'),
      email: formData.get('email'),
      message: formData.get('message'),
    });

    // Here is where you would integrate an email sending service
    // For example, using Resend, Nodemailer, or SendGrid.
    console.log('New contact form submission:');
    console.log('Name:', parsedData.name);
    console.log('Email:', parsedData.email);
    console.log('Message:', parsedData.message);

    return {
      success: true,
      message: 'Your message has been sent successfully!',
    };
  } catch (error) {
    console.error('Contact form submission error:', error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Please correct the errors in the form.',
      };
    }
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    };
  }
}
