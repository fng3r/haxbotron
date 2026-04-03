import { NextResponse } from 'next/server';

import { getControlPlaneEventBus } from '@/lib/control-plane/event-bus';
import { getControlPlaneService } from '@/lib/control-plane/service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const service = getControlPlaneService();
  await service.init();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send('ready', { ok: true });

      const unsubscribe = getControlPlaneEventBus().on((event) => {
        send(event.event, event);
      });

      const heartbeat = setInterval(() => {
        send('heartbeat', { timestamp: Date.now() });
      }, 25_000);

      const close = () => {
        clearInterval(heartbeat);
        unsubscribe();
        controller.close();
      };

      request.signal.addEventListener('abort', close, { once: true });
    },
    cancel() {
      // The request abort handler above owns cleanup.
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream',
    },
  });
}
