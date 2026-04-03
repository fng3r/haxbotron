import axios from 'axios';

import { NextRequest, NextResponse } from 'next/server';

import { getControlPlaneService, isControlPlaneError } from '@/lib/control-plane/service';

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
    if (isControlPlaneError(error)) {
      return NextResponse.json({ message: error.message, code: error.code }, { status: error.status });
    }

    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 502;
      const data = error.response?.data;

      if (data == null) {
        return NextResponse.json({ message: error.message || 'Upstream request failed.' }, { status });
      }

      if (typeof data === 'object') {
        return NextResponse.json(data, { status });
      }

      return NextResponse.json({ message: String(data) }, { status });
    }

    const message = error instanceof Error ? error.message : 'Request failed.';
    return NextResponse.json({ message }, { status: 500 });
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
