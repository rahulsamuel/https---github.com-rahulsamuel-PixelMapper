import { NextRequest, NextResponse } from "next/server";

const TECH_DOC_IMAGE_PATH = "/storage/v1/object/sign/tech-doc-images/";

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!rawUrl || !supabaseUrl) return NextResponse.json({ error: "Image unavailable" }, { status: 400 });

  let target: URL;
  let allowedOrigin: URL;
  try {
    target = new URL(rawUrl);
    allowedOrigin = new URL(supabaseUrl);
  } catch {
    return NextResponse.json({ error: "Image unavailable" }, { status: 400 });
  }

  if (target.origin !== allowedOrigin.origin || !target.pathname.startsWith(TECH_DOC_IMAGE_PATH)) {
    return NextResponse.json({ error: "Image unavailable" }, { status: 403 });
  }

  try {
    const response = await fetch(target, { cache: "no-store" });
    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok || !contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Image unavailable" }, { status: 404 });
    }

    return new Response(response.body, {
      status: 200,
      headers: {
        "Cache-Control": "private, max-age=300",
        "Content-Type": contentType,
      },
    });
  } catch {
    return NextResponse.json({ error: "Image unavailable" }, { status: 502 });
  }
}
