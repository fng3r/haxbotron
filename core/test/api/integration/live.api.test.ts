import { afterEach, describe, expect, it } from '@jest/globals';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Server } from 'socket.io';
import { io, type Socket } from 'socket.io-client';
import { RoomProcessManager } from '../../../src/lib/room/RoomProcessManager.js';
import type { LiveFrame } from '../../../src/lib/room/LiveProtocol.js';

// Seed room handles to exercise the transport without launching real hosts.
describe('live WebSocket subscriptions', () => {
    const clients: Socket[] = [];
    let server: Server | undefined;
    afterEach(async () => {
        clients.forEach(client => client.disconnect());
        await new Promise<void>(resolve => server ? server.close(() => resolve()) : resolve());
    });

    it('sends cached geometry to late viewers and isolates room subscriptions', async () => {
        const http = createServer();
        server = new Server(http, { path: '/ws', transports: ['websocket'] });
        const manager = new RoomProcessManager();
        const stadium = { name: 'Test', width: 420, height: 200 };
        const frame: LiveFrame = { sequence: 1, timestamp: Date.now(), status: 'stopped', scores: null, discs: [], players: [] };
        const roomA = { ruid: 'a', liveFrame: frame, liveStadium: stadium };
        const roomB = { ruid: 'b', liveFrame: frame, liveStadium: stadium };
        Reflect.get(manager, 'rooms').set('a', roomA);
        Reflect.get(manager, 'rooms').set('b', roomB);
        manager.attachSocketIOServer(server);
        await new Promise<void>(resolve => http.listen(0, '127.0.0.1', resolve));
        const socket = io(`http://127.0.0.1:${(http.address() as AddressInfo).port}`, { path: '/ws', transports: ['websocket'], reconnection: false });
        clients.push(socket);
        await new Promise<void>((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); });
        const received: Array<LiveFrame & { ruid: string }> = [];
        socket.on('live', payload => received.push(payload));
        const subscribe = (ruid: string) => new Promise<{ ok: boolean }>(resolve => socket.emit('live:subscribe', ruid, resolve));
        expect(await subscribe('a')).toEqual({ ok: true });
        expect(received[0]).toMatchObject({ ruid: 'a', stadium });
        expect(await subscribe('missing')).toMatchObject({ ok: false });
        expect(await subscribe('b')).toEqual({ ok: true });
        received.length = 0;
        Reflect.get(manager, 'handleWorkerEvent').call(manager, roomA, { type: 'event', event: 'live', payload: { ...frame, sequence: 2, stadium } });
        Reflect.get(manager, 'handleWorkerEvent').call(manager, roomB, { type: 'event', event: 'live', payload: { ...frame, sequence: 2, stadium } });
        // ACK follows the reliable frame and provides a delivery barrier.
        await subscribe('b');
        expect(received).toHaveLength(2);
        expect(received.every(item => item.ruid === 'b')).toBe(true);
        expect(received[0].sequence).toBe(2);
    });
});
