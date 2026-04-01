import { NextRequest, NextResponse } from 'next/server';

import { getControlPlaneService } from '@/lib/control-plane/service';

type RouteContext = {
  params: Promise<{ hostId: string }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { hostId } = await context.params;
    const body = await request.json();
    const service = getControlPlaneService();
    await service.init();
    const host = await service.updateHost(hostId, {
      name: body.name,
      baseUrl: body.baseUrl,
      enabled: Boolean(body.enabled),
    });
    return NextResponse.json(host);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to update host.' }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { hostId } = await context.params;
    const service = getControlPlaneService();
    await service.init();
    await service.deleteHost(hostId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to delete host.' }, { status: 400 });
  }
}
