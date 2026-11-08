import { createClient } from "npm:@supabase/supabase-js@2.39.0";

type Bucket = { hits: number[] };

/** Per-isolate fallback window so a request is never unlimited if the durable limiter errors. */
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
  const key = `${scope}:${identifier}`;

  if (memoryLimited(key, limit, windowSeconds)) return true;

  try {
    const { data, error } = await createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    ).rpc("consume_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.error("Rate limit check failed:", error.message);
      return false;
    }
    return data !== true;
  } catch (err) {
    console.error("Rate limit check threw:", err instanceof Error ? err.message : err);
    return false;
  }
}
