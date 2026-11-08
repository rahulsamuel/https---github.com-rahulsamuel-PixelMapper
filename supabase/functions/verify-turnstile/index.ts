const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const MAX_TOKEN_LENGTH = 2048;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const secret = Deno.env.get("CLOUDFLARE_SECRET_KEY");
    if (!secret) {
      return json({ error: "The security check is not configured." }, 500);
    }

    const body = await req.json().catch(() => null);
    const token = body?.token;
    if (typeof token !== "string" || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
      return json({ success: false, error: "Missing security token." }, 400);
    }

    const form = new FormData();
    form.append("secret", secret);
    form.append("response", token);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (ip) form.append("remoteip", ip);

    const verification = await fetch(SITEVERIFY_URL, { method: "POST", body: form });
    if (!verification.ok) {
      return json({ error: "The security check could not be completed." }, 502);
    }

    const result = await verification.json();
    return json({ success: result?.success === true });
  } catch (err) {
    console.error("verify-turnstile failed:", err);
    return json({ error: "The security check could not be completed." }, 500);
  }
});
