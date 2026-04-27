
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { eventType, eventData } = await req.json();

    if (!eventType || !eventData) {
      return NextResponse.json({ message: 'Missing required event data' }, { status: 400 });
    }

    console.log('Tracking event:', { eventType, eventData });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error tracking event:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to track event', error: message }, { status: 500 });
  }
}
