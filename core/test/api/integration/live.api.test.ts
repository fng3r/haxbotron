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
