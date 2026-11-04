import type { Server as HTTPServer } from 'node:http';

import { Server } from 'socket.io';
import { io } from 'socket.io-client';

import { generateToken, verifyToken } from '@/lib/auth/jwt';
import { getControlPlaneService } from '@/lib/control-plane/service';

type RelayHTTPServer = HTTPServer & { liveIO?: Server; publicLiveIO?: Server };

// The public relay only forwards broadcast data. It never forwards arbitrary client events.
// The core host remains authenticated; no upstream credentials reach the browser.
export function ensureLiveRelay(server: RelayHTTPServer, publicAccess: boolean): void {
  const serverKey = publicAccess ? 'publicLiveIO' : 'liveIO';
  if (!server[serverKey]) {
    const live = new Server(server, {
      path: publicAccess ? '/public-live-ws' : '/live-ws',
      transports: ['websocket'],
      serveClient: false,
    });
    server[serverKey] = live;
    live.use(async (socket, next) => {
      const cookie = socket.request.headers.cookie
        ?.split(';')
        .map((v) => v.trim())
        .find((v) => v.startsWith('access_token='));
      const token = cookie?.slice('access_token='.length);
      const origin = socket.request.headers.origin;
      let sameOrigin = !origin;
      try {
        if (origin) sameOrigin = new URL(origin).host === socket.request.headers.host;
      } catch {
        sameOrigin = false;
      }
      if (!sameOrigin || (!publicAccess && (!token || !(await verifyToken(token))))) {
        next(new Error('Unauthorized'));
        return;
      }
      next();
    });
    live.on('connection', (socket) => {
      let upstream: ReturnType<typeof io> | undefined;
      let generation = 0;
      socket.on('live:subscribe', async (ruid: unknown) => {
        const current = ++generation;
        upstream?.disconnect();
        if (typeof ruid !== 'string' || !ruid || ruid.length > 200) return;
        try {
          const service = getControlPlaneService();
          if (publicAccess && !(await service.listPublicLiveRooms()).some((room) => room.ruid === ruid)) {
            throw new Error('Broadcast unavailable');
          }
          const state = await service.getState();
          const mapping = state.mappings.find((m) => m.ruid === ruid);
          const host = state.hosts.find((h) => h.id === mapping?.hostId && h.enabled);
          if (!host) throw new Error('Room has no enabled host');
          const token = await generateToken('live-relay');
          if (!socket.connected || current !== generation) return;
          const source = io(host.baseUrl, {
            path: '/ws',
            transports: ['websocket'],
            forceNew: true,
            extraHeaders: { cookie: `access_token=${token}` },
          });
          upstream = source;
          source.on('connect', () =>
            source.emit('live:subscribe', ruid, (result: { ok: boolean; error?: string }) => {
              if (!result.ok) socket.emit('live:error', result.error || 'Room is offline');
            }),
          );
          source.on('roomct', (event: { ruid: string }) => {
            if (event.ruid === ruid) source.emit('live:subscribe', ruid);
          });
          let latestGoalId: string | undefined;
          source.on('live', (frame) => {
            if (frame.ruid !== ruid) return;
            const newGoal = frame.goal && frame.goal.id !== latestGoalId;
            latestGoalId = frame.goal?.id;
            if (frame.stadium || newGoal || frame.timeline) socket.emit('live', frame);
            else socket.volatile.emit('live', frame);
          });
          source.on('live:offline', () => socket.emit('live:error', 'Room is offline'));
          source.on('disconnect', () => socket.emit('live:error', 'Host disconnected. Reconnecting…'));
          source.on('connect_error', () => socket.emit('live:error', 'Host unavailable. Reconnecting…'));
        } catch {
          socket.emit('live:error', 'Room or host is unavailable');
        }
      });
      socket.on('disconnect', () => {
        ++generation;
        upstream?.disconnect();
      });
    });
  }
}
