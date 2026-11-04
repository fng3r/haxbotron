import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as HTTPServer } from 'node:http';
import type { Socket as NetSocket } from 'node:net';

import { Server } from 'socket.io';
import { io } from 'socket.io-client';

import { generateToken, verifyToken } from '@/lib/auth/jwt';
import { getControlPlaneService } from '@/lib/control-plane/service';

type LiveResponse = NextApiResponse & { socket: NetSocket & { server: HTTPServer & { liveIO?: Server } } };

// Initialise a same-origin WebSocket relay on Next's Node HTTP server.
// Host addresses and host authentication stay on the server.
export default async function handler(req: NextApiRequest, res: LiveResponse) {
  if (!req.cookies.access_token || !(await verifyToken(req.cookies.access_token))) {
    res.status(401).end();
    return;
  }
  const server = res.socket.server;
  if (!server.liveIO) {
    const live = new Server(server, { path: '/live-ws', transports: ['websocket'], serveClient: false });
    server.liveIO = live;
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
      if (!sameOrigin || !token || !(await verifyToken(token))) {
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
  res.status(200).json({ ok: true });
}
