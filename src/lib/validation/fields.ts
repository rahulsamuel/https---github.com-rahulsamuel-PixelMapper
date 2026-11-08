import { z } from 'zod';

const NO_CONTROL_CHARS = /^[^\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]*$/;
const HTTP_URL = /^https?:\/\//i;

export const plainText = (max: number, min = 0) =>
  z
    .string()
    .trim()
    .min(min, { message: `Must be at least ${min} characters.` })
    .max(max, { message: `Must be ${max} characters or fewer.` })
    .regex(NO_CONTROL_CHARS, { message: 'Contains invalid characters.' });

export const emailField = z
  .string()
  .trim()
  .max(254, { message: 'Email must be 254 characters or fewer.' })
  .email({ message: 'Please enter a valid email address.' });

export const httpUrlField = z
  .string()
  .trim()
  .max(2048, { message: 'Link must be 2048 characters or fewer.' })
  .refine(v => HTTP_URL.test(v), { message: 'Link must start with http:// or https://.' })
  .refine(v => {
    try {
      return new URL(v).protocol.startsWith('http');
    } catch {
      return false;
    }
  }, { message: 'Please enter a valid link.' });

export const optionalHttpUrlField = z.union([z.literal(''), httpUrlField]).optional();

export const specSheetField = z
  .string()
  .trim()
  .max(2048, { message: 'Spec sheet must be 2048 characters or fewer.' })
  .refine(v => HTTP_URL.test(v) || !v.includes(':'), {
    message: 'Spec sheet must be a web link or a file name.',
  });

export const optionalSpecSheetField = z.union([z.literal(''), specSheetField]).optional();
