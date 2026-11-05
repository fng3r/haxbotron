import { NextResponse } from 'next/server';

import { getControlPlaneService } from '@/lib/control-plane/service';
import { getLiveViewerCount } from '@/lib/live/viewers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rooms = await getControlPlaneService().listPublicLiveRooms();
    return NextResponse.json(
      { rooms: rooms.map((room) => ({ ...room, viewers: getLiveViewerCount(room.ruid) })) },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json({ message: 'Broadcast directory is temporarily unavailable.' }, { status: 503 });
  }
}
