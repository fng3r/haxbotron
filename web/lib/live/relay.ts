import type { Server as HTTPServer } from 'node:http';

import { Server } from 'socket.io';
import { io } from 'socket.io-client';

import { generateToken } from '@/lib/auth/jwt';
import { getControlPlaneService } from '@/lib/control-plane/service';
import { LiveChat } from '@/lib/live/chat';

type RelayHTTPServer = HTTPServer & { publicLiveIO?: Server; liveChat?: LiveChat };

// The relay forwards broadcast data and handles viewer chat locally.
// It never forwards arbitrary client events to core.
// The core host remains authenticated; no upstream credentials reach the browser.
export function ensureLiveRelay(server: RelayHTTPServer): void {
  const chat = (server.liveChat ??= new LiveChat());
  if (!server.publicLiveIO) {
    const live = new Server(server, {
      path: '/public-live-ws',
      transports: ['websocket'],
      maxHttpBufferSize: 8192,
      serveClient: false,
    });
    server.publicLiveIO = live;
    live.use(async (socket, next) => {
      const origin = socket.request.headers.origin;
      let sameOrigin = !origin;
      try {
        if (origin) sameOrigin = new URL(origin).host === socket.request.headers.host;
      } catch {
        sameOrigin = false;
      }
      if (!sameOrigin) {
        next(new Error('Unauthorized'));
        return;
      }
      next();
    });
    live.on('connection', (socket) => {
      let upstream: ReturnType<typeof io> | undefined;
      let generation = 0;
      let chatRoom: string | undefined;
      const leaveChat = () => {
        if (chatRoom) void socket.leave(`chat:${chatRoom}`);
        chatRoom = undefined;
      };
      socket.on('chat:send', (payload: unknown, ack?: (result: { ok: boolean; error?: string }) => void) => {
        if (typeof ack !== 'function') return;
        if (!chatRoom) return ack({ ok: false, error: 'Connect to a broadcast before chatting.' });
        const result = chat.send(chatRoom, socket.id, payload);
        if (result.ok) {
          live.to(`chat:${chatRoom}`).emit('chat:message', result.message);
        }
        ack(result.ok ? { ok: true } : result);
      });
      socket.on('live:subscribe', async (ruid: unknown) => {
        const current = ++generation;
        leaveChat();
        upstream?.disconnect();
        if (typeof ruid !== 'string' || !ruid || ruid.length > 200) return;
        try {
          const service = getControlPlaneService();
          if (!(await service.listPublicLiveRooms()).some((room) => room.ruid === ruid)) {
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
          const subscribe = () =>
            source.emit('live:subscribe', ruid, (result: { ok: boolean; error?: string }) => {
              if (!socket.connected || current !== generation) return;
              if (!result.ok) {
                leaveChat();
                socket.emit('live:error', result.error || 'Room is offline');
              } else {
                chatRoom = ruid;
                void socket.join(`chat:${ruid}`);
                socket.emit('chat:history', { ruid, messages: chat.history(ruid) });
              }
            });
          source.on('connect', subscribe);
          source.on('roomct', (event: { ruid: string }) => {
            if (event.ruid === ruid) subscribe();
          });
          let latestGoalId: string | undefined;
          source.on('live:viewers', (payload: { ruid: string; viewers: number }) => {
            if (payload.ruid === ruid) socket.emit('live:viewers', payload);
          });
          source.on('live', (frame) => {
            if (frame.ruid !== ruid) return;
            const newGoal = frame.goal && frame.goal.id !== latestGoalId;
            latestGoalId = frame.goal?.id;
            if (frame.stadium || newGoal || frame.timeline) socket.emit('live', frame);
            else socket.volatile.emit('live', frame);
          });
          source.on('live:offline', () => {
            leaveChat();
            socket.emit('live:error', 'Room is offline');
          });
          source.on('disconnect', () => {
            leaveChat();
            socket.emit('live:error', 'Host disconnected. Reconnecting…');
          });
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
