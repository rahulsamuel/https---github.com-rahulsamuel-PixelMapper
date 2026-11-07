import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.39.0";
import Stripe from "npm:stripe@14.25.0";
import { buildReceiptPdf } from "./receipt-pdf.ts";

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

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
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
    const pdf = buildReceiptPdf({
      receipt_number: receipt.receipt_number,
      customer_email: receipt.customer_email,
      items: receipt.items as ReceiptItem[],
      product_fee_cents: receipt.product_fee_cents,
      processing_fee_cents: receipt.processing_fee_cents,
      total_cents: receipt.total_cents,
      date: new Date(receipt.paid_at ?? receipt.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "MapMyLED <receipts@mapmyled.com>",
        to: [receipt.customer_email],
        subject: `Your MapMyLED receipt ${receipt.receipt_number}`,
        text: "Thank you for your purchase. Your receipt is attached as a PDF. You can also view and download it under Receipts in your MapMyLED account.",
        attachments: [{ filename: `${receipt.receipt_number}.pdf`, content: toBase64(pdf) }],
      }),
    });
    if (!res.ok) throw new Error(`Resend responded ${res.status}: ${await res.text()}`);

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

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

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
        .insert({ ...item.row, created_by: receipt.user_id, visibility: "private" })
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
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
