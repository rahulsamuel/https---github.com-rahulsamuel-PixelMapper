import { createClient } from "npm:@supabase/supabase-js@2.39.0";

export async function isRateLimited(
  scope: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const { data, error } = await createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  ).rpc("consume_rate_limit", {
    p_key: `${scope}:${identifier}`,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("Rate limit check failed:", error.message);
    return false;
  }
  return data !== true;
}
