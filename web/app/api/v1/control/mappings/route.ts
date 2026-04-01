import { NextRequest, NextResponse } from 'next/server';

import { getControlPlaneService } from '@/lib/control-plane/service';

export async function GET() {
  try {
    const service = getControlPlaneService();
    await service.init();
    return NextResponse.json(await service.listMappings());
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to load mappings.' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const service = getControlPlaneService();
    await service.init();
    const mapping = await service.createMapping({
      ruid: body.ruid,
      hostId: body.hostId,
    });
    return NextResponse.json(mapping, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to create mapping.' },
      { status: 400 },
    );
  }
}
