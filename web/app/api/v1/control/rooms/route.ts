import { NextResponse } from 'next/server';

import { getControlPlaneService } from '@/lib/control-plane/service';

export async function GET() {
  try {
    const service = getControlPlaneService();
    await service.init();
    return NextResponse.json(await service.listManagedRooms());
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to load managed rooms.' },
      { status: 500 },
    );
  }
}
