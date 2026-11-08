import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';

export function clientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'unknown';
}

export async function isRateLimited(
  scope: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const hashedId = createHash('sha256').update(identifier).digest('hex');
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await adminClient.rpc('consume_rate_limit', {
    p_key: `${scope}:${hashedId}`,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error('Rate limit check failed:', error.message);
    return false;
  }
  return data !== true;
}
