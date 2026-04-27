
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventType, eventData } = body;

    if (!eventType || !eventData) {
      return NextResponse.json({ message: 'Missing required event data' }, { status: 400 });
    }

    // Persist pixel map snapshots for grid-png downloads
    if (eventType === 'download' && eventData.type === 'grid-png' && eventData.thumbnail) {
      const {
        thumbnail,
        userId,
        sessionId,
        screenName,
        gridWidth,
        gridHeight,
        projectData,
      } = eventData;

      await supabase.from('pixel_map_snapshots').insert({
        user_id: userId ?? null,
        session_id: sessionId ?? '',
        screen_name: screenName ?? 'Untitled',
        grid_width: gridWidth ?? 0,
        grid_height: gridHeight ?? 0,
        thumbnail,
        project_data: projectData ?? null,
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error tracking event:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to track event', error: message }, { status: 500 });
  }
}
