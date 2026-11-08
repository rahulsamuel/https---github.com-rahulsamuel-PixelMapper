import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { plainText } from '@/lib/validation/fields';
import { clientIp, isRateLimited } from '@/lib/rate-limit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TRACKED_TYPES = new Set([
  'wiring-diagram',
  'full-raster-map',
  'raster-slice',
  'composite-wiring-diagram',
  'project-file',
]);

const MAX_PROJECT_DATA_CHARS = 2_000_000;

const bodySchema = z.object({
  eventType: plainText(50, 1),
  eventData: z.record(z.unknown()),
});

const downloadEventSchema = z.object({
  type: plainText(50).optional(),
  thumbnail: z.string().max(5_000_000).optional(),
  sessionId: plainText(100).optional(),
  screenName: plainText(200).optional(),
  gridWidth: z.number().int().min(0).max(100_000).optional(),
  gridHeight: z.number().int().min(0).max(100_000).optional(),
  projectData: z.unknown().optional().refine(
    v => v === undefined || JSON.stringify(v).length <= MAX_PROJECT_DATA_CHARS,
    { message: 'Project data is too large.' },
  ),
  filename: plainText(255).optional(),
});

export async function POST(req: NextRequest) {
  try {
    if (await isRateLimited('track', clientIp(req.headers), 120, 600)) {
      return NextResponse.json({ message: 'Too many requests' }, { status: 429 });
    }

    const body = bodySchema.safeParse(await req.json().catch(() => null));
    if (!body.success) {
      return NextResponse.json({ message: 'Missing required event data' }, { status: 400 });
    }
    const { eventType, eventData } = body.data;

    if (eventType === 'download') {
      const parsed = downloadEventSchema.safeParse(eventData);
      if (!parsed.success) {
        return NextResponse.json({ message: 'Invalid event data' }, { status: 400 });
      }
      const {
        type, thumbnail, sessionId,
        screenName, gridWidth, gridHeight, projectData, filename,
      } = parsed.data;

      if (type && TRACKED_TYPES.has(type)) {
        await supabase.from('pixel_map_snapshots').insert({
          session_id: sessionId ?? '',
          screen_name: screenName ?? filename ?? type,
          grid_width: gridWidth ?? 0,
          grid_height: gridHeight ?? 0,
          thumbnail: thumbnail ?? '',
          project_data: projectData ?? null,
          download_type: type,
          filename: filename ?? '',
          ip_address: clientIp(req.headers),
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
