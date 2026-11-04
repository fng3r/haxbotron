import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type { RoomRuntime } from '../../../src/game/runtime/RoomRuntime.js';
import { parseLiveStadium, publishLiveFrame } from '../../../src/game/runtime/LiveBroadcast.js';
import { parseRoomWorkerMessage } from '../../../src/lib/room/RoomProtocol.js';
import { getStadiumData } from '../../../src/lib/stadiumLoader.js';

const originalSend = process.send;
const originalConnected = Object.getOwnPropertyDescriptor(process, 'connected');
afterEach(() => {
    process.send = originalSend;
    if (originalConnected) Object.defineProperty(process, 'connected', originalConnected);
    else delete (process as { connected?: boolean }).connected;
});

function fixture() {
    let scores: object | null = { red: 1, blue: 2, time: 12, scoreLimit: 3, timeLimit: 5 };
    const disc = { x: 3, y: 5, radius: 10, color: 0xffffff, xspeed: 1, cGroup: 1 };
    const player = { id: 7, name: 'Player', team: 1, input: 0, auth: 'secret-auth', conn: 'private-ip' };
    const native = {
        InputFlags: { kick: 16 },
        getScores: () => scores,
        getDiscCount: () => 1,
        getDiscProperties: () => disc,
        getPlayerDiscProperties: () => disc,
        getPlayerList: () => [player, { id: 8, name: 'Spectator', team: 0, input: 16 }],
    };
    const runtime = {
        room: { getRoom: () => native, getStadiumSource: () => getStadiumData('classic') },
        match: { isPlaying: () => true },
    } as unknown as RoomRuntime;
    return { runtime, player, stop: () => { scores = null; } };
}

describe('live broadcast snapshots', () => {
    it('streams held shot input and releases independently of ball contact', () => {
        const send = jest.fn();
        process.send = send as typeof process.send;
        Object.defineProperty(process, 'connected', { configurable: true, value: true });
        const { runtime, player, stop } = fixture();
        const capture = () => {
            publishLiveFrame(runtime);
            const call = send.mock.calls[send.mock.calls.length - 1];
            (call[1] as () => void)();
            expect(parseRoomWorkerMessage(call[0]).success).toBe(true);
            return (call[0] as { payload: { players: { kicking: boolean }[] } }).payload.players;
        };
        // Movement alone does not activate the outline. Mixed movement + shot does.
        player.input = 1;
        expect(capture()[0].kicking).toBe(false);
        player.input = 1 | 16;
        expect(capture().map(p => p.kicking)).toEqual([true, false]);
        expect(capture()[0].kicking).toBe(true);
        player.input = 1;
        expect(capture()[0].kicking).toBe(false);
        player.input = 16;
        player.team = 0;
        expect(capture()[0].kicking).toBe(false);
        player.team = 1;
        stop();
        expect(capture()[0].kicking).toBe(false);
    });

    it('loads bundled JSON5 stadiums and resolves visible segment traits', () => {
        for (const name of ['classic', 'big', 'bigeasy', 'realsoccer', 'futsal1v1', 'futsal4v4', 'bff4v4', 'icebear', '6man', 'gbhotbig', 'gbhotclassic']) {
            const stadium = parseLiveStadium(getStadiumData(name)!);
            expect(stadium.width).toBeGreaterThan(0);
            expect(stadium.segments?.length).toBeGreaterThan(0);
        }
        const stadium = parseLiveStadium(`{name:'Test',width:100,height:50,traits:{hidden:{vis:false}},segments:[{v0:0,v1:1,trait:'hidden'}]}`);
        expect(stadium.segments?.[0].vis).toBe(false);
    });

    it('sends public positions, preserves spectators, and drops ticks while IPC is busy', () => {
        const send = jest.fn();
        process.send = send as typeof process.send;
        Object.defineProperty(process, 'connected', { configurable: true, value: true });
        const { runtime, stop } = fixture();
        publishLiveFrame(runtime);
        const message = send.mock.calls[0][0];
        expect(parseRoomWorkerMessage(message).success).toBe(true);
        expect(JSON.stringify(message)).not.toMatch(/secret-auth|private-ip|xspeed|cGroup/);
        expect(message).toMatchObject({ payload: { status: 'playing', stadium: { name: 'Classic' }, players: [{ id: 7, disc: { x: 3 } }, { id: 8, disc: null }] } });
        publishLiveFrame(runtime);
        expect(send).toHaveBeenCalledTimes(1);
        (send.mock.calls[0][1] as () => void)();
        stop();
        publishLiveFrame(runtime);
        expect(send.mock.calls[1][0]).toMatchObject({ payload: { status: 'stopped', scores: null, discs: [] } });
        expect(send.mock.calls[1][0]).not.toHaveProperty('payload.stadium');
    });
});
