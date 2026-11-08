import type { Server as HTTPServer } from 'node:http';

import { Server } from 'socket.io';
import { io } from 'socket.io-client';

import { generateToken } from '@/lib/auth/jwt';
import { getControlPlaneService } from '@/lib/control-plane/service';
import { LiveChat } from '@/lib/live/chat';
import { getMatchHistory } from '@/lib/live/match-history';
import { LiveRelayPool } from '@/lib/live/relay-pool';
import { setLiveViewerCount } from '@/lib/live/viewers';

type RelayHTTPServer = HTTPServer & { publicLiveIO?: Server; liveChat?: LiveChat; livePool?: LiveRelayPool };

// Browser commands are never forwarded to core. Each watched room shares one upstream.
export function ensureLiveRelay(server: RelayHTTPServer): void {
  if (server.publicLiveIO) return;
  const chat = (server.liveChat ??= new LiveChat());
  const live = new Server(server, {
    path: '/public-live-ws',
    transports: ['websocket'],
    maxHttpBufferSize: 8192,
    serveClient: false,
  });
  server.publicLiveIO = live;
  const pool = new LiveRelayPool({
    onCount: setLiveViewerCount,
    onReady: (viewer, ruid) => {
      viewer.emit('chat:history', { ruid, messages: chat.history(ruid) });
      viewer.emit('match:history', { ruid, matches: getMatchHistory().list(ruid) });
    },
    createSource: async (ruid) => {
      const state = await getControlPlaneService().getState();
      const mapping = state.mappings.find((m) => m.ruid === ruid);
      const host = state.hosts.find((h) => h.id === mapping?.hostId && h.enabled);
      if (!host) throw new Error('Room has no enabled host');
      const token = await generateToken('live-relay');
      return io(host.baseUrl, {
        path: '/ws',
        transports: ['websocket'],
        forceNew: true,
        autoConnect: false,
        extraHeaders: { cookie: `access_token=${token}` },
      });
    },
  });
  server.livePool = pool;
  const unsubscribeHistory = getMatchHistory().subscribe((ruid, matches) =>
    pool.broadcast(ruid, 'match:history', { ruid, matches }),
  );
  live.once('close', unsubscribeHistory);
  server.once('close', unsubscribeHistory);
  live.on('close', () => pool.dispose());
  server.once('close', () => pool.dispose());
  live.use((socket, next) => {
    const origin = socket.request.headers.origin;
    let sameOrigin = !origin;
    try {
      if (origin) sameOrigin = new URL(origin).host === socket.request.headers.host;
    } catch {
      sameOrigin = false;
    }
    next(sameOrigin ? undefined : new Error('Unauthorized'));
  });
  live.on('connection', (socket) => {
    let generation = 0;
    let subscribed: string | undefined;
    socket.on('chat:send', (payload: unknown, ack?: (result: { ok: boolean; error?: string }) => void) => {
      if (typeof ack !== 'function') return;
      const ruid = pool.readyRoom(socket.id);
      if (!ruid) return ack({ ok: false, error: 'Connect to a broadcast before chatting.' });
      const result = chat.send(ruid, socket.id, payload);
      if (result.ok) pool.broadcast(ruid, 'chat:message', result.message);
      ack(result.ok ? { ok: true } : result);
    });
    socket.on('live:subscribe', async (ruid: unknown) => {
      const current = ++generation;
      if (typeof ruid === 'string' && subscribed === ruid) {
        pool.join(ruid, socket);
        return;
      }
      pool.leave(socket.id);
      subscribed = undefined;
      if (typeof ruid !== 'string' || !ruid || ruid.length > 200) return;
      try {
        const rooms = await getControlPlaneService().listPublicLiveRooms();
        if (!socket.connected || current !== generation) return;
        if (!rooms.some((room) => room.ruid === ruid)) throw new Error('Broadcast unavailable');
        subscribed = ruid;
        pool.join(ruid, socket);
      } catch {
        if (socket.connected && current === generation) socket.emit('live:error', 'Room or host is unavailable');
      }
    });
    socket.on('live:unsubscribe', () => {
      ++generation;
      subscribed = undefined;
      pool.leave(socket.id);
    });
    socket.on('disconnect', () => {
      ++generation;
      pool.leave(socket.id);
    });
  });
}
