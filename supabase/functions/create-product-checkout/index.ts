import { createClient } from "npm:@supabase/supabase-js@2.39.0";
import Stripe from "npm:stripe@14.25.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PRODUCT_FEE_CENTS = 299;
const CARD_PERCENT_FEE = 0.029;
const CARD_FIXED_FEE_CENTS = 30;
const MAX_PRODUCTS_PER_CHECKOUT = 20;

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function calculateFees(productCount: number) {
  const productFeeCents = PRODUCT_FEE_CENTS * productCount;
  const totalCents = Math.ceil((productFeeCents + CARD_FIXED_FEE_CENTS) / (1 - CARD_PERCENT_FEE));
  const processingFeeCents = totalCents - productFeeCents;
  return { productFeeCents, processingFeeCents, totalCents };
}

function generateReceiptNumber() {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `MML-${date}-${hex}`;
}

function isValidReturnUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return jsonResponse({ error: "Payments are not configured yet. Please try again later." }, 500);
    }

    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: { user } } = await createClient(supabaseUrl, anonKey).auth.getUser(token);
    if (!user) {
      return jsonResponse({ error: "Please sign in to add products." }, 401);
    }

    const body = await req.json();
    const rows = body?.rows;
    const returnUrl = body?.returnUrl;
    if (!Array.isArray(rows) || rows.length === 0 || rows.length > MAX_PRODUCTS_PER_CHECKOUT) {
      return jsonResponse({ error: "Select between 1 and 20 products to check out." }, 400);
    }
    if (!rows.every(r => r && typeof r === "object" && typeof r.manufacturer === "string" && typeof r.product_name === "string")) {
      return jsonResponse({ error: "One or more products are incomplete." }, 400);
    }
    if (!isValidReturnUrl(returnUrl)) {
      return jsonResponse({ error: "Invalid return address." }, 400);
    }

    const { productFeeCents, processingFeeCents, totalCents } = calculateFees(rows.length);
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: receipt, error: insertError } = await admin
      .from("receipts")
      .insert({
        user_id: user.id,
        receipt_number: generateReceiptNumber(),
        status: "pending",
        customer_email: user.email ?? null,
        items: rows.map(row => ({ manufacturer: row.manufacturer, product_name: row.product_name, row, led_product_id: null })),
        product_fee_cents: productFeeCents,
        processing_fee_cents: processingFeeCents,
        total_cents: totalCents,
        currency: "usd",
      })
      .select("id")
      .single();

    if (insertError || !receipt) {
      return jsonResponse({ error: "Could not start checkout. Please try again." }, 500);
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2024-06-20",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const separator = returnUrl.includes("?") ? "&" : "?";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email ?? undefined,
      client_reference_id: receipt.id,
      metadata: { receipt_id: receipt.id },
      line_items: [
        {
          quantity: rows.length,
          price_data: {
            currency: "usd",
            unit_amount: PRODUCT_FEE_CENTS,
            product_data: { name: "LED product listing fee" },
          },
        },
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: processingFeeCents,
            product_data: { name: "Card processing fee" },
          },
        },
      ],
      success_url: `${returnUrl}${separator}checkout=success&receipt=${receipt.id}`,
      cancel_url: `${returnUrl}${separator}checkout=cancelled`,
    });

    if (!session.url) {
      await admin.from("receipts").update({ status: "expired" }).eq("id", receipt.id);
      return jsonResponse({ error: "Could not start checkout. Please try again." }, 500);
    }

    return jsonResponse({ url: session.url, receiptId: receipt.id }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
