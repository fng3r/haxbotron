import { afterEach, describe, expect, it } from '@jest/globals';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Server } from 'socket.io';
import { io, type Socket } from 'socket.io-client';
import { RoomProcessManager } from '../../../src/lib/room/RoomProcessManager.js';
import type { LiveFrame } from '../../../src/lib/room/LiveProtocol.js';
import { MatchTimeline } from '../../../src/game/runtime/MatchTimeline.js';

// Seed room handles to exercise the transport without launching real hosts.
describe('live WebSocket subscriptions', () => {
    const clients: Socket[] = [];
    let server: Server | undefined;
    afterEach(async () => {
        clients.forEach(client => client.disconnect());
        await new Promise<void>(resolve => server ? server.close(() => resolve()) : resolve());
    });

    it('counts active viewers across subscriptions, room switches, repeats and disconnects', async () => {
        const http = createServer();
        server = new Server(http, { path: '/ws', transports: ['websocket'] });
        const manager = new RoomProcessManager();
        Reflect.get(manager, 'rooms').set('a', { ruid: 'a' });
        Reflect.get(manager, 'rooms').set('b', { ruid: 'b' });
        manager.attachSocketIOServer(server);
        await new Promise<void>(resolve => http.listen(0, '127.0.0.1', resolve));
        const connect = async () => {
            const socket = io(`http://127.0.0.1:${(http.address() as AddressInfo).port}`, { path: '/ws', transports: ['websocket'], reconnection: false });
            clients.push(socket);
            await new Promise<void>((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); });
            return socket;
        };
        const first = await connect();
        const second = await connect();
        await connect(); // A control socket that is not watching a broadcast must not count.
        const counts: { ruid: string; viewers: number }[] = [];
        first.on('live:viewers', payload => counts.push(payload));
        const subscribe = (socket: Socket, ruid: string) => new Promise<{ ok: boolean }>(resolve => socket.emit('live:subscribe', ruid, resolve));
        expect(manager.getLiveViewerCount('a')).toBe(0);
        await subscribe(first, 'a');
        expect(counts[counts.length - 1]).toEqual({ ruid: 'a', viewers: 1 });
        await subscribe(second, 'a');
        await subscribe(first, 'a'); // ACK provides a delivery barrier for the first client.
        expect(counts[counts.length - 1]).toEqual({ ruid: 'a', viewers: 2 });
        expect(manager.getLiveViewerCount('a')).toBe(2);
        counts.length = 0;
        await subscribe(first, 'a');
        expect(counts).toEqual([{ ruid: 'a', viewers: 2 }]);
        await subscribe(second, 'b');
        await subscribe(first, 'a');
        expect(manager.getLiveViewerCount('a')).toBe(1);
        expect(manager.getLiveViewerCount('b')).toBe(1);
        expect(counts[counts.length - 1]).toEqual({ ruid: 'a', viewers: 1 });
        expect(await subscribe(first, 'missing')).toMatchObject({ ok: false });
        expect(manager.getLiveViewerCount('a')).toBe(1);
        const serverSocket = server.sockets.sockets.get(first.id!)!;
        const disconnected = new Promise<void>(resolve => serverSocket.once('disconnect', () => resolve()));
        first.disconnect();
        await disconnected;
        expect(manager.getLiveViewerCount('a')).toBe(0);
        const reloaded = await connect();
        await subscribe(reloaded, 'b');
        expect(manager.getLiveViewerCount('b')).toBe(2);
        const left = new Promise<void>(resolve => server!.sockets.adapter.once('leave-room', () => resolve()));
        reloaded.emit('live:unsubscribe');
        await left;
        expect(manager.getLiveViewerCount('b')).toBe(1);
    });

    it('restores events recorded without viewers on a fresh connection and isolates subsequent matches', async () => {
        const http = createServer();
        server = new Server(http, { path: '/ws', transports: ['websocket'] });
        const manager = new RoomProcessManager();
        const room = { ruid: 'room' };
        Reflect.get(manager, 'rooms').set('room', room);
        manager.attachSocketIOServer(server);
        const history = new MatchTimeline();
        history.start();
        history.append({ type: 'goal', team: 1, scores: { red: 1, blue: 0 } }, 12);
        let sequence = 0;
        const publish = (withTimeline: boolean) => {
            const frame: LiveFrame = { sequence: ++sequence, timestamp: Date.now(), status: 'playing',
                scores: { red: 1, blue: 0, time: 12, scoreLimit: 3, timeLimit: 300 },
                discs: [], players: [], matchId: history.getSnapshot()!.matchId,
                ...(withTimeline ? { timeline: history.getSnapshot()! } : {}),
            };
            Reflect.get(manager, 'handleWorkerEvent').call(manager, room, { type: 'event', event: 'live', payload: frame });
        };
        publish(true); publish(false);
        await new Promise<void>(resolve => http.listen(0, '127.0.0.1', resolve));
        const subscribe = async () => {
            const socket = io(`http://127.0.0.1:${(http.address() as AddressInfo).port}`, { path: '/ws', transports: ['websocket'], reconnection: false });
            clients.push(socket);
            await new Promise<void>((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); });
            const restored = new Promise<LiveFrame>(resolve => socket.once('live', resolve));
            socket.emit('live:subscribe', 'room');
            return { socket, frame: await restored };
        };
        const first = await subscribe();
        const matchId = first.frame.matchId;
        expect(first.frame.timeline?.events.map(event => event.type)).toEqual(['start', 'goal']);
        first.socket.disconnect();
        // Events continue accumulating with the tab closed; ordinary ticks omit history.
        history.append({ type: 'pause', actor: { id: 1, name: 'Admin' } }, 20);
        publish(true); publish(false);
        const reloaded = await subscribe();
        expect(reloaded.frame.matchId).toBe(matchId);
        expect(reloaded.frame.timeline?.events.map(event => event.type)).toEqual(['start', 'goal', 'pause']);
        reloaded.socket.disconnect();
        history.start(); publish(true); publish(false);
        const nextMatch = await subscribe();
        expect(nextMatch.frame.matchId).not.toBe(matchId);
        expect(nextMatch.frame.timeline?.events.map(event => event.type)).toEqual(['start']);
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
