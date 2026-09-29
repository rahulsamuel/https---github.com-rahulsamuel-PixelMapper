import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const EXTRACTION_PROMPT = `You are an expert AV / broadcast engineer who can identify equipment from photos or spec sheets.

Analyze the provided image or PDF and identify the device. Return a JSON object describing the device and ALL of its ports (inputs and outputs).

## Fields to extract

- name: string — the device name (manufacturer + model, e.g. "Brompton SX40", "NovaStar MX30"). If you can only see a model number, use that.
- deviceType: string — one of: "processor", "led-screen", "media-server", "power-supply", "network-switch", "matrix", "distribution", "converter", "custom". Pick the closest match.
- category: string — one of: "processor", "media-server", "led-screen", "power", "network", "converter", "other". Pick the closest match.
- color: string — hex color for the device block. Use a color that suits the device type (processors: dark blue #1e3a5f, media servers: dark red #7c2d12, LED screens: teal #0d9488, power: amber #b45309, network: blue #1e40af, converters: #6d28d9, other: #475569).
- ports: array of port objects, each with:
  - label: string — the port label as shown on the device (e.g. "HDMI IN 1", "SDI OUT", "DATA IN", "PORT 1"). Use the exact label if visible, otherwise a descriptive label.
  - direction: string — "input" or "output"
  - portType: string — the connector/signal type. Must be one of: "hdmi", "sdi", "rj45", "dvi", "fiber", "power", "usb", "dmx", "custom". Use "rj45" for ethernet/data ports, "power" for power inputs/outputs, "usb" for USB ports, "dmx" for DMX lighting control ports.

## Analysis rules

1. PHYSICAL PHOTOS: Look carefully at the back/front panel of the device. Identify every connector you can see. Common connector types:
   - HDMI ports (trapezoidal shape)
   - SDI/BNC ports (round coaxial connectors, often labeled SDI)
   - RJ45/Ethernet ports (rectangular, 8-pin)
   - DVI ports (larger rectangular, often white)
   - Fiber optic ports (often labeled "Fiber", "OPT", or have dust caps)
   - Power connectors (IEC, PowerCON, Edison, etc.)
   - Other connectors (USB, DisplayPort, DMX, etc. → use "usb" for USB, "dmx" for DMX, or "custom")

2. SPEC SHEETS / PDFs: Read the input/output specifications section. Count the number of each type of port. Create one port entry per physical port.

3. PORT DIRECTION: Inputs receive signal (e.g. "HDMI IN", "SDI IN"). Outputs send signal (e.g. "OUT 1", "DATA OUT"). Power inputs are "input" direction with portType "power". Power outputs (e.g. on a power supply) are "output" direction with portType "power".

4. PORT LABELS: Use the labels printed on the device if visible. If not visible, use sensible defaults like "HDMI IN 1", "HDMI IN 2", "OUT 1", "OUT 2", etc.

5. If you cannot identify the device at all, return { "name": "", "deviceType": "custom", "category": "other", "color": "#475569", "ports": [] }.

6. Return ONLY valid JSON. No markdown fences, no explanations.

## Example output

{
  "name": "Brompton SX40",
  "deviceType": "processor",
  "category": "processor",
  "color": "#1e3a5f",
  "ports": [
    { "label": "HDMI IN 1", "direction": "input", "portType": "hdmi" },
    { "label": "HDMI IN 2", "direction": "input", "portType": "hdmi" },
    { "label": "SDI IN", "direction": "input", "portType": "sdi" },
    { "label": "OUT 1", "direction": "output", "portType": "rj45" },
    { "label": "OUT 2", "direction": "output", "portType": "rj45" },
    { "label": "OUT 3", "direction": "output", "portType": "rj45" },
    { "label": "OUT 4", "direction": "output", "portType": "rj45" }
  ]
}`;

function uint8ToBase64(uint8: Uint8Array): string {
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < uint8.length; i += chunkSize) {
    const chunk = uint8.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

async function callGemini(
  apiKey: string,
  parts: Record<string, unknown>[]
): Promise<string> {
  const model = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
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

function parseJsonResponse(text: string): Record<string, unknown> | null {
  if (!text || !text.trim()) return null;

  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

const VALID_DEVICE_TYPES = ["processor", "led-screen", "media-server", "power-supply", "network-switch", "matrix", "distribution", "converter", "custom"];
const VALID_CATEGORIES = ["processor", "media-server", "led-screen", "power", "network", "converter", "other"];
const VALID_PORT_TYPES = ["hdmi", "sdi", "rj45", "dvi", "fiber", "power", "usb", "dmx", "custom"];

function normalizeDevice(raw: Record<string, unknown>): Record<string, unknown> {
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  let deviceType = typeof raw.deviceType === "string" ? raw.deviceType : "custom";
  if (!VALID_DEVICE_TYPES.includes(deviceType)) deviceType = "custom";

  let category = typeof raw.category === "string" ? raw.category : "other";
  if (!VALID_CATEGORIES.includes(category)) category = "other";

  const color = typeof raw.color === "string" && raw.color.startsWith("#") ? raw.color : "#475569";

  const rawPorts = Array.isArray(raw.ports) ? raw.ports : [];
  const ports = rawPorts
    .filter((p: unknown) => p && typeof p === "object" && typeof (p as Record<string, unknown>).label === "string")
    .map((p: unknown) => {
      const port = p as Record<string, unknown>;
      let portType = typeof port.portType === "string" ? port.portType : "custom";
      if (!VALID_PORT_TYPES.includes(portType)) portType = "custom";
      const direction = port.direction === "input" ? "input" : "output";
      return {
        label: String(port.label).trim(),
        direction,
        portType,
      };
    });

  const portCount = ports.length;
  const height = Math.max(120, 34 + 36 + portCount * 22);

  return {
    name,
    deviceType,
    category,
    color,
    width: 200,
    height,
    ports,
    is_active: true,
  };
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
    let raw: Record<string, unknown> | null = null;

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
      const base64 = uint8ToBase64(uint8);
      const mimeType = (file.type || "image/jpeg") as string;

      const parts: Record<string, unknown>[] = [
        { inlineData: { mimeType, data: base64 } },
        { text: EXTRACTION_PROMPT },
      ];

      const responseText = await callGemini(geminiKey, parts);
      raw = parseJsonResponse(responseText);
    } else {
      return new Response(
        JSON.stringify({ error: "Expected multipart/form-data with a file upload." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!raw) {
      return new Response(
        JSON.stringify({ error: "Could not parse the AI response. Try a clearer image." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const device = normalizeDevice(raw);

    return new Response(
      JSON.stringify({ device }),
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
