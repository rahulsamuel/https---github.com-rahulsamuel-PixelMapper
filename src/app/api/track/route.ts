
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Download types that produce a visual thumbnail
const TRACKED_TYPES = new Set([
  'wiring-diagram',
  'full-raster-map',
  'raster-slice',
  'composite-wiring-diagram',
  'project-file',
]);

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    ''
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventType, eventData } = body;

    if (!eventType || !eventData) {
      return NextResponse.json({ message: 'Missing required event data' }, { status: 400 });
    }

    if (eventType === 'download') {
      const {
        type,
        thumbnail,
        userId,
        sessionId,
        screenName,
        gridWidth,
        gridHeight,
        projectData,
        filename,
      } = eventData;

      const ip = getClientIp(req);

      if (TRACKED_TYPES.has(type)) {
        await supabase.from('pixel_map_snapshots').insert({
          user_id: userId ?? null,
          session_id: sessionId ?? '',
          screen_name: screenName ?? filename ?? type,
          grid_width: gridWidth ?? 0,
          grid_height: gridHeight ?? 0,
          thumbnail: thumbnail ?? '',
          project_data: projectData ?? null,
          download_type: type,
          filename: filename ?? '',
          ip_address: ip,
        });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error tracking event:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to track event', error: message }, { status: 500 });
  }
}
