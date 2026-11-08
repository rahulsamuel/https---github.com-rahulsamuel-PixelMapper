import { supabase } from '@/lib/supabase/client';

const CAPTCHA_FAILED_MESSAGE = 'The security check did not pass. Please complete it again and retry.';

export async function verifyTurnstileToken(token: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('verify-turnstile', { body: { token } });
    if (error || data?.success !== true) return CAPTCHA_FAILED_MESSAGE;
    return null;
  } catch {
    return 'Could not reach the security check. Please try again.';
  }
}
