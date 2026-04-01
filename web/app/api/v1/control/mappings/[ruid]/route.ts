import { NextRequest, NextResponse } from 'next/server';

import { getControlPlaneService } from '@/lib/control-plane/service';

type RouteContext = {
  params: Promise<{ ruid: string }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { ruid } = await context.params;
    const body = await request.json();
    const service = getControlPlaneService();
    await service.init();
    const mapping = await service.updateMapping(ruid, body.hostId);
    return NextResponse.json(mapping);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to update mapping.' },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { ruid } = await context.params;
    const service = getControlPlaneService();
    await service.init();
    await service.deleteMapping(ruid);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to delete mapping.' },
      { status: 400 },
    );
  }
}
