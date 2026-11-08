import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.39.0";
import Stripe from "npm:stripe@14.25.0";
import { buildReceiptPdf, type ReceiptPdfData } from "./receipt-pdf.ts";
import { sendReceiptEmail } from "./receipt-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type ReceiptItem = {
  manufacturer: string;
  product_name: string;
  row: Record<string, unknown>;
  led_product_id: string | null;
};

/** Columns a buyer is allowed to supply for a product listing. Anything else in a
 * stored receipt item is ignored, so a crafted checkout payload cannot write columns
 * such as id, created_by or visibility through the service-role insert below. */
const ALLOWED_PRODUCT_COLUMNS = [
  "manufacturer",
  "product_name",
  "tile_width_px",
  "tile_height_px",
  "watts_per_tile",
  "avg_watts_per_tile",
  "pixel_pitch_mm",
  "tile_width_mm",
  "tile_height_mm",
  "tile_depth_mm",
  "tile_weight_kg",
  "max_power_w_per_sqm",
  "avg_power_w_per_sqm",
  "max_brightness_nit",
  "refresh_rate_hz",
  "grayscale_bit",
  "contrast_ratio",
  "color_temperature_k",
  "viewing_angle_h",
  "viewing_angle_v",
  "drive_mode",
  "led_type",
  "ip_rating",
  "certification",
  "application_indoor",
  "application_outdoor",
  "application_floor",
  "product_image_url",
  "spec_sheet_url",
] as const;

function sanitizeProductRow(row: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const key of ALLOWED_PRODUCT_COLUMNS) {
    if (row[key] !== undefined) clean[key] = row[key];
  }
  return clean;
}

type ReceiptRow = {
  receipt_number: string;
  customer_email: string | null;
  items: unknown;
  product_fee_cents: number;
  processing_fee_cents: number;
  total_cents: number;
  paid_at: string | null;
  created_at: string;
};

function toPdfData(receipt: ReceiptRow): ReceiptPdfData {
  return {
    receipt_number: receipt.receipt_number,
    customer_email: receipt.customer_email,
    items: receipt.items as ReceiptItem[],
    product_fee_cents: receipt.product_fee_cents,
    processing_fee_cents: receipt.processing_fee_cents,
    total_cents: receipt.total_cents,
    date: new Date(receipt.paid_at ?? receipt.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
  };
}

async function receiptPdfResponse(req: Request, admin: SupabaseClient): Promise<Response> {
  const token = req.headers.get("Authorization")?.replace(/^Bearer /, "");
  const receiptId = new URL(req.url).searchParams.get("receipt_id");
  if (!token || !receiptId) {
    return new Response(JSON.stringify({ error: "Missing session or receipt" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: "Please sign in to download receipts." }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: receipt, error } = await admin
    .from("receipts")
    .select("receipt_number, customer_email, items, product_fee_cents, processing_fee_cents, total_cents, paid_at, created_at")
    .eq("id", receiptId)
    .eq("user_id", userData.user.id)
    .eq("status", "paid")
    .maybeSingle();
  if (error) throw error;
  if (!receipt) {
    return new Response(JSON.stringify({ error: "Receipt not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const pdf = await buildReceiptPdf(toPdfData(receipt));
  return new Response(pdf, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${receipt.receipt_number}.pdf"`,
    },
  });
}

async function emailReceiptIfNeeded(admin: SupabaseClient, receiptId: string): Promise<void> {
  const { data: receipt, error } = await admin
    .from("receipts")
    .select("id, receipt_number, customer_email, items, product_fee_cents, processing_fee_cents, total_cents, paid_at, created_at, email_sent_at")
    .eq("id", receiptId)
    .maybeSingle();
  if (error || !receipt) {
    console.error("Receipt lookup for email failed", error?.message ?? receiptId);
    return;
  }
  if (receipt.email_sent_at || !receipt.customer_email) return;

  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set; receipt email skipped", receipt.receipt_number);
    return;
  }

  try {
    const data = toPdfData({ ...receipt, customer_email: receipt.customer_email });
    const pdf = await buildReceiptPdf(data);
    await sendReceiptEmail(apiKey, data, pdf);

    await admin.from("receipts").update({ email_sent_at: new Date().toISOString() }).eq("id", receiptId);
  } catch (err) {
    console.error("Receipt email failed", receipt.receipt_number, err instanceof Error ? err.message : err);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (req.method === "GET") return await receiptPdfResponse(req, admin);

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey || !webhookSecret) {
      return new Response(JSON.stringify({ error: "Stripe is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2024-06-20",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const signature = req.headers.get("Stripe-Signature");
    if (!signature) {
      return new Response("Missing signature", { status: 400, headers: corsHeaders });
    }

    const payload = await req.text();
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        payload,
        signature,
        webhookSecret,
        undefined,
        Stripe.createSubtleCryptoProvider(),
      );
    } catch {
      return new Response("Invalid signature", { status: 400, headers: corsHeaders });
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const receiptId = session.metadata?.receipt_id;
      if (receiptId) {
        await admin.from("receipts").update({ status: "expired" }).eq("id", receiptId).eq("status", "pending");
      }
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (event.type !== "checkout.session.completed") {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const receiptId = session.metadata?.receipt_id;
    if (!receiptId || session.payment_status !== "paid") {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: receipt, error: receiptError } = await admin
      .from("receipts")
      .select("id, user_id, status, items")
      .eq("id", receiptId)
      .maybeSingle();

    if (receiptError) throw receiptError;
    if (!receipt) {
      return new Response(JSON.stringify({ error: "Receipt not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (receipt.status === "paid") {
      await emailReceiptIfNeeded(admin, receipt.id);
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const items = (receipt.items as ReceiptItem[]).map(item => ({ ...item }));
    for (const item of items) {
      if (item.led_product_id) continue;
      const { data: created, error: productError } = await admin
        .from("led_products")
        .insert({
          ...sanitizeProductRow((item.row ?? {}) as Record<string, unknown>),
          created_by: receipt.user_id,
          visibility: "private",
        })
        .select("id")
        .single();
      if (productError || !created) {
        throw new Error(`Could not save product ${item.manufacturer} ${item.product_name}: ${productError?.message ?? "unknown error"}`);
      }
      item.led_product_id = created.id;
      await admin.from("receipts").update({ items }).eq("id", receipt.id);
    }

    const { error: paidError } = await admin
      .from("receipts")
      .update({ status: "paid", paid_at: new Date().toISOString(), items })
      .eq("id", receipt.id);
    if (paidError) throw paidError;

    await emailReceiptIfNeeded(admin, receipt.id);

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("stripe-webhook failed:", err instanceof Error ? err.message : err);
    return new Response(JSON.stringify({ error: "Webhook processing failed." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
