import { NextRequest, NextResponse } from 'next/server';

import { getControlPlaneService } from '@/lib/control-plane/service';

export async function GET() {
  try {
    const service = getControlPlaneService();
    await service.init();
    return NextResponse.json(await service.listHosts());
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to load hosts.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const service = getControlPlaneService();
    await service.init();
    const host = await service.createHost({
      id: body.id,
      name: body.name,
      baseUrl: body.baseUrl,
      enabled: Boolean(body.enabled),
    });
    return NextResponse.json(host, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to create host.' }, { status: 400 });
  }
}
