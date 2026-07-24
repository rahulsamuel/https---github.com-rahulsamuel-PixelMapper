import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const EXTRACTION_PROMPT = `You are an expert at reading LED video processor / LED controller specification sheets.
Extract ALL processor products found in this document and return a JSON object.

For EACH product found, extract these fields (use null if not found):
- manufacturer: string (company name, e.g. "Brompton Technology", "NovaStar", "Helios")
- modelName: string (model name, e.g. "Tessera SX40", "MCTRL4K", "R2")
- totalPixelCapacity: number (total pixels the unit can drive, e.g. 9000000 for 9 million)
- outputPortCount: number (number of physical output data ports, e.g. 4 for SX40, 16 for MCTRL4K)
- pixelsPerPort: number (pixels per individual output port — total / ports if not stated explicitly)
- baseRefreshRateHz: number (refresh rate at which the above capacity applies, default 60)
- maxInputResolutionW: number (maximum input width in pixels, e.g. 3840)
- maxInputResolutionH: number (maximum input height in pixels, e.g. 2160)
- inputTypes: string (comma-separated list of input connector types, e.g. "HDMI 2.0, 12G-SDI, DP 1.2")
- rackUnits: number (rack unit height, e.g. 2)
- weightKg: number (weight in kg)
- powerWatts: number (typical power consumption in watts)
- powerInput: string (AC power input spec, e.g. "100–240V AC, 50/60 Hz")
- depthMm: number (depth / length in mm)
- widthMm: number (width in mm, typically ~482 for 1U/2U rack gear)
- heightMm: number (height in mm)
- notes: string (any important notes about port structure, distribution requirements, etc.)

IMPORTANT NOTES:
- totalPixelCapacity is the TOTAL pixels across ALL output ports.
- pixelsPerPort = totalPixelCapacity / outputPortCount (compute this if not stated).
- For Brompton processors using 10G ports with XD distribution, the outputPortCount refers to 10G ports.
- Return ONLY valid JSON with no markdown fences or explanation.

Return format:
{
  "products": [
    { ...all fields above... }
  ]
}`;

async function callGemini(
  apiKey: string,
  parts: Record<string, unknown>[]
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
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
  return json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
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
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed.products) ? parsed.products : [];
  } catch {
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const geminiKey = Deno.env.get("GOOGLE_AI_API_KEY");
  if (!geminiKey) {
    return new Response(
      JSON.stringify({ error: "GOOGLE_AI_API_KEY is not configured." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    let products: Record<string, unknown>[] = [];

    if (contentType.includes("multipart/form-data")) {
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
        const html = await pageResp.text();
        const pageText = stripHtml(html);
        const prompt = `${EXTRACTION_PROMPT}\n\nPage URL: ${url}\n\nPage content:\n${pageText}`;
        const responseText = await callGemini(geminiKey, [{ text: prompt }]);
        products = parseJsonResponse(responseText);
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
