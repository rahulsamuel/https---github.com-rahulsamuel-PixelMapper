import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';

export function clientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'unknown';
}

type Bucket = { hits: number[] };

/**
 * Per-instance fallback window. This always applies, so a request is never
 * unlimited even when the durable database limiter is unavailable or errors.
 */
const memoryBuckets = new Map<string, Bucket>();

function memoryLimited(key: string, limit: number, windowSeconds: number): boolean {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const bucket = memoryBuckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter(t => now - t < windowMs);
  if (bucket.hits.length >= limit) {
    memoryBuckets.set(key, bucket);
    return true;
  }
  bucket.hits.push(now);
  memoryBuckets.set(key, bucket);
  if (memoryBuckets.size > 5000) {
    for (const [k, v] of memoryBuckets) {
      if (v.hits.length === 0 || now - v.hits[v.hits.length - 1] > windowMs) memoryBuckets.delete(k);
    }
  }
  return false;
}

export async function isRateLimited(
  scope: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const hashedId = createHash('sha256').update(identifier).digest('hex');
  const key = `${scope}:${hashedId}`;

  // Always consume the in-process budget first.
  if (memoryLimited(key, limit, windowSeconds)) return true;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    // No privileged key available: the in-process window above is the only limiter.
    return false;
  }

  try {
    const adminClient = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await adminClient.rpc('consume_rate_limit', {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.error('Rate limit check failed:', error.message);
      return false;
    }
    return data !== true;
  } catch (err) {
    console.error('Rate limit check threw:', err instanceof Error ? err.message : err);
    return false;
  }
}
