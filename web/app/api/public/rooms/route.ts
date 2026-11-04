import { NextResponse } from 'next/server';

import { getControlPlaneService } from '@/lib/control-plane/service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rooms = await getControlPlaneService().listPublicLiveRooms();
    return NextResponse.json({ rooms }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ message: 'Broadcast directory is temporarily unavailable.' }, { status: 503 });
  }
}
