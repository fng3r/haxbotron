import { NextRequest, NextResponse } from 'next/server';

import { getControlPlaneService } from '@/lib/control-plane/service';

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function handle(method: 'GET' | 'POST' | 'PUT' | 'DELETE', request: NextRequest, context: RouteContext) {
  try {
    const { path } = await context.params;
    const service = getControlPlaneService();
    await service.init();

    const body = method === 'GET' ? undefined : await request.json().catch(() => undefined);
    const data = await service.proxyRequest(method, path, request.nextUrl.searchParams, body);

    if (data === undefined) {
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed.';
    const status = /not assigned|not found|unknown host|was not found/i.test(message)
      ? 404
      : /unavailable|disabled/i.test(message)
        ? 503
        : /already exists|already has a mapping/i.test(message)
          ? 409
          : 400;
    return NextResponse.json({ message }, { status });
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return await handle('GET', request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return await handle('POST', request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return await handle('PUT', request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return await handle('DELETE', request, context);
}
