import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Anthropic from "npm:@anthropic-ai/sdk@0.32.1";
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
- For panel resolution: if spec shows "384x192/192x192", these are two sizes - split them.
- Power in W/m² is PER SQUARE METER, not per tile.
- Return ONLY valid JSON, no markdown, no explanation.

Return format:
{
  "products": [
    { ...all fields above... },
    ...
  ]
}`;

function extractImageUrls(html: string, baseUrl: string): string[] {
  const urls: string[] = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    if (!src || src.startsWith('data:')) continue;
    try {
      const absolute = src.startsWith('http') ? src : new URL(src, baseUrl).href;
      if (absolute.match(/\.(jpg|jpeg|png|webp)(\?|$)/i)) {
        urls.push(absolute);
      }
    } catch {
      // skip invalid URLs
    }
  }
  return [...new Set(urls)].slice(0, 10);
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .substring(0, 60000);
}

async function storeImage(
  supabase: ReturnType<typeof createClient>,
  imageUrl: string,
  filename: string
): Promise<string | null> {
  try {
    const resp = await fetch(imageUrl);
    if (!resp.ok) return null;
    const contentType = resp.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) return null;
    const buffer = await resp.arrayBuffer();
    if (buffer.byteLength < 1000) return null; // skip tiny images (icons)

    const ext = contentType.split('/')[1]?.split(';')[0] || 'jpg';
    const path = `${Date.now()}-${filename}.${ext}`;

    const { error } = await supabase.storage
      .from('product-images')
      .upload(path, buffer, { contentType, upsert: false });

    if (error) return null;

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(path);

    return publicUrl;
  } catch {
    return null;
  }
}

function parseClaudeResponse(text: string): Record<string, unknown>[] {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return [];
  const parsed = JSON.parse(jsonMatch[0]);
  return Array.isArray(parsed.products) ? parsed.products : [];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!anthropicKey) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured. Please add it as a Supabase secret." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const anthropic = new Anthropic({ apiKey: anthropicKey });
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const contentType = req.headers.get("content-type") || "";
    let products: Record<string, unknown>[] = [];

    if (contentType.includes("multipart/form-data")) {
      // File upload path
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
      for (let i = 0; i < uint8.length; i++) {
        binary += String.fromCharCode(uint8[i]);
      }
      const base64 = btoa(binary);
      const mediaType = file.type || "application/pdf";

      let messageContent: Anthropic.MessageParam["content"];

      if (mediaType === "application/pdf") {
        messageContent = [
          {
            type: "document" as const,
            source: { type: "base64" as const, media_type: "application/pdf" as const, data: base64 },
          },
          { type: "text" as const, text: EXTRACTION_PROMPT },
        ];
      } else {
        const imgMediaType = mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
        messageContent = [
          {
            type: "image" as const,
            source: { type: "base64" as const, media_type: imgMediaType, data: base64 },
          },
          { type: "text" as const, text: EXTRACTION_PROMPT },
        ];
      }

      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        messages: [{ role: "user", content: messageContent }],
      });

      const text = response.content[0].type === "text" ? response.content[0].text : "";
      products = parseClaudeResponse(text);
    } else {
      // URL path
      const body = await req.json();
      const { url } = body as { url: string };

      if (!url) {
        return new Response(
          JSON.stringify({ error: "No URL provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch the page
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
        // URL points directly to a PDF
        const pdfBuffer = await pageResp.arrayBuffer();
        const uint8 = new Uint8Array(pdfBuffer);
        let binary = "";
        for (let i = 0; i < uint8.length; i++) {
          binary += String.fromCharCode(uint8[i]);
        }
        const base64 = btoa(binary);

        const response = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 4096,
          messages: [{
            role: "user",
            content: [
              {
                type: "document" as const,
                source: { type: "base64" as const, media_type: "application/pdf" as const, data: base64 },
              },
              { type: "text" as const, text: EXTRACTION_PROMPT },
            ],
          }],
        });

        const text = response.content[0].type === "text" ? response.content[0].text : "";
        products = parseClaudeResponse(text);
      } else {
        // HTML page
        const html = await pageResp.text();
        const pageText = stripHtml(html);
        const imageUrls = extractImageUrls(html, url);

        const prompt = `${EXTRACTION_PROMPT}\n\nPage URL: ${url}\n\nPage text content:\n${pageText}`;

        const response = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 4096,
          messages: [{ role: "user", content: prompt }],
        });

        const responseText = response.content[0].type === "text" ? response.content[0].text : "";
        products = parseClaudeResponse(responseText);

        // Try to find and store product images
        if (imageUrls.length > 0 && products.length > 0) {
          for (let i = 0; i < products.length; i++) {
            const product = products[i];
            if (!product.productImageUrl) {
              const imgUrl = imageUrls[i] || imageUrls[0];
              if (imgUrl) {
                const storedUrl = await storeImage(
                  supabase,
                  imgUrl,
                  String(product.productName || `product-${i}`).replace(/[^a-z0-9]/gi, '-').toLowerCase()
                );
                if (storedUrl) {
                  products[i] = { ...product, productImageUrl: storedUrl };
                } else {
                  products[i] = { ...product, productImageUrl: imgUrl };
                }
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
