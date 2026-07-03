import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const EXTRACTION_PROMPT = `You are an expert at reading LED display product specification sheets.
Extract ALL LED products found in this document and return a JSON object.

For EACH product variant found, extract these fields (use null if not found):
- manufacturer: string (company name, e.g. "Absen", "ROE Visual", "Leyard")
- productName: string (model name, e.g. "SA1.9", "BP2.8")
- pixelPitchMm: number (pixel pitch in mm, e.g. 2.6)
- tileWidthMm: number (panel physical width in mm)
- tileHeightMm: number (panel physical height in mm)
- tileDepthMm: number (panel depth/thickness in mm)
- tileWidthPx: number (panel resolution width in pixels)
- tileHeightPx: number (panel resolution height in pixels)
- tileWeightKg: number (panel weight in kg)
- maxPowerWPerSqm: number (max power consumption in W/m²)
- avgPowerWPerSqm: number (average/typical power in W/m²)
- maxBrightnessNit: number (peak brightness in nits)
- refreshRateHz: number (refresh rate in Hz)
- grayscaleBit: number (grayscale depth in bits)
- contrastRatio: string (e.g. "5500:1")
- colorTemperatureK: number (default color temp in Kelvin)
- viewingAngleH: number (horizontal viewing angle in degrees)
- viewingAngleV: number (vertical viewing angle in degrees)
- driveMode: string (e.g. "1/16", "1/8")
- ledType: string (e.g. "Black SMD1515", "Flip Chip IMD 4in1")
- ipRating: string (e.g. "IP40/IP21")
- certification: string (e.g. "FCC, ETL, CE, RoHS")
- applicationIndoor: boolean
- applicationOutdoor: boolean
- applicationFloor: boolean

IMPORTANT NOTES:
- If a panel has multiple size options (e.g. 500x500mm and 1000x500mm), create a separate entry for each size.
- For panel resolution: if spec shows "384x192/192x192", these are two sizes — split them.
- Power in W/m² is PER SQUARE METER, not per tile.
- Return ONLY valid JSON with no markdown fences or explanation.

Return format:
{
  "products": [
    { ...all fields above... }
  ]
}`;

// ─── Gemini REST helper ───────────────────────────────────────────────────────

async function callGemini(
  apiKey: string,
  parts: Record<string, unknown>[]
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
      maxOutputTokens: 8192,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${err}`);
  }

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return text;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function extractImageUrls(html: string, baseUrl: string): string[] {
  const urls: string[] = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    if (!src || src.startsWith("data:")) continue;
    try {
      const absolute = src.startsWith("http") ? src : new URL(src, baseUrl).href;
      if (absolute.match(/\.(jpg|jpeg|png|webp)(\?|$)/i)) urls.push(absolute);
    } catch { /* skip */ }
  }
  return [...new Set(urls)].slice(0, 10);
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s{2,}/g, " ")
    .trim()
    .substring(0, 60000);
}

function parseJsonResponse(text: string): Record<string, unknown>[] {
  try {
    // Strip markdown fences if present
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed.products) ? parsed.products : [];
  } catch {
    // Try to find JSON object in the text
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        return Array.isArray(parsed.products) ? parsed.products : [];
      } catch { /* fall through */ }
    }
    return [];
  }
}

async function storeImage(
  supabase: ReturnType<typeof createClient>,
  imageUrl: string,
  filename: string
): Promise<string | null> {
  try {
    const resp = await fetch(imageUrl);
    if (!resp.ok) return null;
    const contentType = resp.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) return null;
    const buffer = await resp.arrayBuffer();
    if (buffer.byteLength < 1000) return null;

    const ext = contentType.split("/")[1]?.split(";")[0] || "jpg";
    const path = `${Date.now()}-${filename.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.${ext}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, buffer, { contentType, upsert: false });

    if (error) return imageUrl; // Fall back to original URL if storage fails

    const { data: { publicUrl } } = supabase.storage
      .from("product-images")
      .getPublicUrl(path);

    return publicUrl;
  } catch {
    return null;
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const geminiKey = Deno.env.get("GOOGLE_AI_API_KEY");
  if (!geminiKey) {
    return new Response(
      JSON.stringify({
        error:
          "GOOGLE_AI_API_KEY is not configured. Get a free key at aistudio.google.com, then add it as a Supabase Edge Function secret.",
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const contentType = req.headers.get("content-type") || "";
    let products: Record<string, unknown>[] = [];

    if (contentType.includes("multipart/form-data")) {
      // ── File upload path ──────────────────────────────────────────────────
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return new Response(
          JSON.stringify({ error: "No file provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
      const base64 = btoa(binary);
      const mimeType = (file.type || "application/pdf") as string;

      const parts: Record<string, unknown>[] = [
        { inlineData: { mimeType, data: base64 } },
        { text: EXTRACTION_PROMPT },
      ];

      const responseText = await callGemini(geminiKey, parts);
      products = parseJsonResponse(responseText);
    } else {
      // ── URL path ──────────────────────────────────────────────────────────
      const body = await req.json();
      const { url } = body as { url: string };

      if (!url) {
        return new Response(
          JSON.stringify({ error: "No URL provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const pageResp = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; MapMyLED/1.0)" },
      });

      if (!pageResp.ok) {
        return new Response(
          JSON.stringify({ error: `Failed to fetch URL: ${pageResp.status} ${pageResp.statusText}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const urlContentType = pageResp.headers.get("content-type") || "";

      if (urlContentType.includes("application/pdf")) {
        // URL points to a PDF — send inline
        const pdfBuffer = await pageResp.arrayBuffer();
        const uint8 = new Uint8Array(pdfBuffer);
        let binary = "";
        for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
        const base64 = btoa(binary);

        const parts: Record<string, unknown>[] = [
          { inlineData: { mimeType: "application/pdf", data: base64 } },
          { text: EXTRACTION_PROMPT },
        ];

        const responseText = await callGemini(geminiKey, parts);
        products = parseJsonResponse(responseText);
      } else {
        // HTML page — extract text and send to Gemini
        const html = await pageResp.text();
        const pageText = stripHtml(html);
        const imageUrls = extractImageUrls(html, url);

        const prompt = `${EXTRACTION_PROMPT}\n\nPage URL: ${url}\n\nPage content:\n${pageText}`;
        const responseText = await callGemini(geminiKey, [{ text: prompt }]);
        products = parseJsonResponse(responseText);

        // Try to save the first matching image per product
        if (imageUrls.length > 0 && products.length > 0) {
          for (let i = 0; i < products.length; i++) {
            if (!products[i].productImageUrl) {
              const imgUrl = imageUrls[i] ?? imageUrls[0];
              if (imgUrl) {
                const stored = await storeImage(
                  supabase,
                  imgUrl,
                  String(products[i].productName ?? `product-${i}`)
                );
                if (stored) products[i] = { ...products[i], productImageUrl: stored };
              }
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ products }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
