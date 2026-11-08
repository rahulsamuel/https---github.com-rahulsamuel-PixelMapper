import { createHash } from 'crypto';
import { getSupabaseServerClient } from '@/lib/supabase/server';

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
  const { data, error } = await getSupabaseServerClient().rpc('consume_rate_limit', {
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
