import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const EXTRACTION_PROMPT = `You are an expert engineer at reading LED display product specification sheets and extracting structured data.

Your job: carefully read the entire document (PDF, image, or HTML text) and extract EVERY LED product variant found. LED spec sheets typically use tables with rows of specifications. Each row or column group represents a product variant (usually differentiated by pixel pitch, e.g. PL 1.5, PL 1.8, PL 2.6, etc.).

## Fields to extract for EACH product variant

Return a JSON object: { "products": [ { ... } ] }

For each product, extract these fields. Use null ONLY if the value truly does not appear anywhere in the document:

- manufacturer: string — the company/brand name (e.g. "Absen", "ROE Visual", "Leyard", "Unilumin"). This is usually in the header or footer.
- productName: string — the specific model/variant name (e.g. "PL 1.8", "SA1.9", "BP2.8"). Include the series prefix and pitch.
- pixelPitchMm: number — pixel pitch in millimeters (e.g. 1.8, 2.6, 3.9). Usually in the product name or a "Pixel Pitch" row.
- tileWidthMm: number — physical panel/cabinet width in mm (e.g. 500, 1000). Look for "Panel Size", "Cabinet Size", "Dimensions".
- tileHeightMm: number — physical panel/cabinet height in mm.
- tileDepthMm: number — panel depth/thickness in mm. Look for "Depth", "Thickness".
- tileWidthPx: number — panel resolution width in pixels (e.g. 256, 320, 384). Look for "Pixels Per Panel", "Resolution", "Pixel Array".
- tileHeightPx: number — panel resolution height in pixels.
- tileWeightKg: number — weight of one panel in kg. Look for "Weight", "Panel Weight".
- maxPowerWPerSqm: number — MAXIMUM power consumption in W/m². Look for "Max Power", "Peak Power", "Power Consumption (Max)".
- avgPowerWPerSqm: number — AVERAGE/typical power in W/m². Look for "Avg Power", "Typical Power", "Power Consumption (Typ)".
- maxBrightnessNit: number — peak brightness in nits/cd/m². Look for "Brightness", "Max Brightness".
- refreshRateHz: number — refresh rate in Hz (e.g. 3840, 7680). Look for "Refresh Rate".
- grayscaleBit: number — grayscale depth in bits (e.g. 14, 16). Look for "Grayscale", "Gray Level".
- contrastRatio: string — e.g. "5500:1", "3000:1". Look for "Contrast Ratio".
- colorTemperatureK: number — default color temperature in Kelvin (e.g. 6500). Look for "Color Temperature".
- viewingAngleH: number — horizontal viewing angle in degrees (e.g. 160, 170). Look for "Viewing Angle".
- viewingAngleV: number — vertical viewing angle in degrees.
- driveMode: string — drive scan mode (e.g. "1/16", "1/8", "1/15"). Look for "Drive Mode", "Scan Mode".
- ledType: string — LED lamp type (e.g. "SMD1515", "Flip Chip IMD 4in1"). Look for "LED Type", "Lamp Type".
- ipRating: string — ingress protection rating (e.g. "IP40", "IP65"). Look for "IP Rating", "Protection Level".
- certification: string — certifications listed (e.g. "FCC, ETL, CE, RoHS"). Look for "Certification", "Certifications".
- applicationIndoor: boolean — true if rated for indoor use.
- applicationOutdoor: boolean — true if rated for outdoor use (high IP rating like IP65+).
- applicationFloor: boolean — true if marketed as floor-rated/load-bearing.
- productImageUrl: string — leave null (filled separately).

## Critical extraction rules

1. TABLE AWARENESS: Most spec sheets present data in tables where each COLUMN is a different product variant (different pitch). Read each column as a separate product. If the table has rows like "Pixel Pitch: 1.5 | 1.8 | 2.6 | 3.9", that means FOUR products.

2. PANEL SIZE VARIANTS: If a single pitch has multiple cabinet sizes (e.g. 500×500mm and 1000×500mm), create a separate entry for each size combination.

3. PIXEL RESOLUTION: "Pixels Per Panel" or "Resolution" like "256×256" means tileWidthPx=256, tileHeightPx=256. If shown as "256×256 / 256×128", those are two panel variants — split them.

4. POWER: "Max Power: 440 W/m²" means maxPowerWPerSqm=440. Do NOT confuse W/m² with watts per tile.

5. BRIGHTNESS: "1500 nits" or "1500 cd/m²" both mean maxBrightnessNit=1500.

6. MANUFACTURER: Extract from document header, title, or footer. If the URL contains a brand name, use that.

7. PRODUCT NAME: Use the series name + pitch (e.g. "PL 1.8", not just "1.8"). If the series is "PL Series" and pitch is 1.8mm, the product name is "PL 1.8".

8. NEVER return an empty products array if the document clearly contains LED display specifications. If you find spec data, extract it. If truly no LED product data exists, return { "products": [] }.

9. Return ONLY valid JSON. No markdown fences, no explanations, no comments.

## Example output for a multi-variant spec sheet

{
  "products": [
    {
      "manufacturer": "Absen",
      "productName": "PL 1.5",
      "pixelPitchMm": 1.5,
      "tileWidthMm": 500,
      "tileHeightMm": 500,
      "tileDepthMm": 72,
      "tileWidthPx": 320,
      "tileHeightPx": 320,
      "tileWeightKg": 8.5,
      "maxPowerWPerSqm": 450,
      "avgPowerWPerSqm": 150,
      "maxBrightnessNit": 1500,
      "refreshRateHz": 3840,
      "grayscaleBit": 16,
      "contrastRatio": "5500:1",
      "colorTemperatureK": 6500,
      "viewingAngleH": 160,
      "viewingAngleV": 160,
      "driveMode": "1/15",
      "ledType": "SMD1515",
      "ipRating": "IP40",
      "certification": "FCC, ETL, CE, RoHS",
      "applicationIndoor": true,
      "applicationOutdoor": false,
      "applicationFloor": false,
      "productImageUrl": null
    },
    {
      "manufacturer": "Absen",
      "productName": "PL 1.8",
      "pixelPitchMm": 1.8,
      "tileWidthMm": 500,
      "tileHeightMm": 500,
      "tileDepthMm": 72,
      "tileWidthPx": 256,
      "tileHeightPx": 256,
      "tileWeightKg": 8.5,
      "maxPowerWPerSqm": 400,
      "avgPowerWPerSqm": 130,
      "maxBrightnessNit": 1500,
      "refreshRateHz": 3840,
      "grayscaleBit": 16,
      "contrastRatio": "5500:1",
      "colorTemperatureK": 6500,
      "viewingAngleH": 160,
      "viewingAngleV": 160,
      "driveMode": "1/15",
      "ledType": "SMD1515",
      "ipRating": "IP40",
      "certification": "FCC, ETL, CE, RoHS",
      "applicationIndoor": true,
      "applicationOutdoor": false,
      "applicationFloor": false,
      "productImageUrl": null
    }
  ]
}`;

// ─── Gemini REST helper ───────────────────────────────────────────────────────

async function callGemini(
  apiKey: string,
  parts: Record<string, unknown>[],
  maxTokens = 16384
): Promise<string> {
  const model = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
      maxOutputTokens: maxTokens,
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

  // Check for finish reason that indicates truncation
  const finishReason = json?.candidates?.[0]?.finishReason;
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  if (finishReason === "MAX_TOKENS" && text) {
    // Try to salvage partial JSON by finding complete product objects
    console.warn("Gemini hit max tokens, attempting to salvage partial response");
  }

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
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/\s{2,}/g, " ")
    .trim()
    .substring(0, 80000);
}

function parseJsonResponse(text: string): Record<string, unknown>[] {
  if (!text || !text.trim()) return [];

  // Strip markdown fences if present
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
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

    // Last resort: try to salvage by finding all complete {...} objects
    const objectMatches = text.match(/\{[^{}]*\}/g);
    if (objectMatches && objectMatches.length > 0) {
      const products: Record<string, unknown>[] = [];
      for (const objStr of objectMatches) {
        try {
          const obj = JSON.parse(objStr);
          if (obj.manufacturer || obj.productName) products.push(obj);
        } catch { /* skip malformed */ }
      }
      if (products.length > 0) return products;
    }

    return [];
  }
}

function validateProduct(p: Record<string, unknown>): boolean {
  // Must have at least a manufacturer or product name to be valid
  const hasName = p.manufacturer || p.productName;
  return !!hasName;
}

async function storeImage(
  supabase: ReturnType<typeof createClient>,
  imageUrl: string,
  filename: string
): Promise<string | null> {
  try {
    const resp = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MapMyLED/1.0)" },
      redirect: "follow",
    });
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

function uint8ToBase64(uint8: Uint8Array): string {
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < uint8.length; i += chunkSize) {
    const chunk = uint8.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
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
    let imageUrls: string[] = [];

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
      const base64 = uint8ToBase64(uint8);
      const mimeType = (file.type || "application/pdf") as string;

      const parts: Record<string, unknown>[] = [
        { inlineData: { mimeType, data: base64 } },
        { text: EXTRACTION_PROMPT },
      ];

      const responseText = await callGemini(geminiKey, parts);
      products = parseJsonResponse(responseText);

      // Retry with a more forceful prompt if nothing found
      if (products.length === 0) {
        const retryPrompt = `${EXTRACTION_PROMPT}\n\nIMPORTANT: The previous attempt returned no products. This document DOES contain LED display specifications. Look very carefully at ALL tables, ALL rows, and ALL columns. Extract every product variant you can find. Even if some fields are missing, return what you can find with nulls for missing fields. Do NOT return an empty array.`;
        const retryParts: Record<string, unknown>[] = [
          { inlineData: { mimeType, data: base64 } },
          { text: retryPrompt },
        ];
        const retryText = await callGemini(geminiKey, retryParts, 24576);
        products = parseJsonResponse(retryText);
      }
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
        redirect: "follow",
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
        const base64 = uint8ToBase64(uint8);

        const parts: Record<string, unknown>[] = [
          { inlineData: { mimeType: "application/pdf", data: base64 } },
          { text: EXTRACTION_PROMPT },
        ];

        const responseText = await callGemini(geminiKey, parts);
        products = parseJsonResponse(responseText);

        // Retry if empty
        if (products.length === 0) {
          const retryPrompt = `${EXTRACTION_PROMPT}\n\nIMPORTANT: The previous attempt returned no products. This PDF DOES contain LED display specifications. Look very carefully at ALL tables, ALL rows, and ALL columns. Extract every product variant you can find. Even if some fields are missing, return what you can find with nulls for missing fields. Do NOT return an empty array.`;
          const retryParts: Record<string, unknown>[] = [
            { inlineData: { mimeType: "application/pdf", data: base64 } },
            { text: retryPrompt },
          ];
          const retryText = await callGemini(geminiKey, retryParts, 24576);
          products = parseJsonResponse(retryText);
        }
      } else {
        // HTML page — extract text and send to Gemini
        const html = await pageResp.text();
        const pageText = stripHtml(html);
        imageUrls = extractImageUrls(html, url);

        const prompt = `${EXTRACTION_PROMPT}\n\nPage URL: ${url}\n\nPage content:\n${pageText}`;
        const responseText = await callGemini(geminiKey, [{ text: prompt }]);
        products = parseJsonResponse(responseText);

        // Retry with more forceful prompt
        if (products.length === 0) {
          const retryPrompt = `${EXTRACTION_PROMPT}\n\nIMPORTANT: The previous attempt returned no products. This page DOES contain LED display specifications. Look very carefully at ALL text, ALL tables, and ALL data. Extract every product variant you can find. Even if some fields are missing, return what you can find with nulls for missing fields. Do NOT return an empty array.\n\nPage URL: ${url}\n\nPage content:\n${pageText}`;
          const retryText = await callGemini(geminiKey, [{ text: retryPrompt }], 24576);
          products = parseJsonResponse(retryText);
        }

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

    // Filter out invalid products (no manufacturer AND no product name)
    products = products.filter(validateProduct);

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
