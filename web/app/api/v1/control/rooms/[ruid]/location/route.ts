import { NextRequest, NextResponse } from 'next/server';

import { getControlPlaneService } from '@/lib/control-plane/service';

type RouteContext = {
  params: Promise<{ ruid: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { ruid } = await context.params;
    const service = getControlPlaneService();
    await service.init();
    return NextResponse.json(await service.getRoomLocation(ruid));
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to load room location.' },
      { status: 404 },
    );
  }
}
