import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type { PlayerObject } from 'haxball.js';
import type { RoomRuntime } from '../../../src/game/runtime/RoomRuntime.js';
import { clearLiveGoal, parseLiveStadium, publishLiveFrame, recordLiveGoal } from '../../../src/game/runtime/LiveBroadcast.js';
import { parseRoomWorkerMessage } from '../../../src/lib/room/RoomProtocol.js';
import { getStadiumData } from '../../../src/lib/stadiumLoader.js';
import { getKickIndicator } from '../../../src/game/runtime/KickIndicator.js';
import { onGameTickListener } from '../../../src/game/controller/events/onGameTick.js';
import { onPlayerBallKickListener } from '../../../src/game/controller/events/onPlayerBallKick.js';
import { getMatchTimeline } from '../../../src/game/runtime/MatchTimeline.js';

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
    const player: PlayerObject & { auth: string; conn: string } = {
        id: 7, name: 'Player', team: 1, input: 0, admin: false, position: { x: 3, y: 5 },
        auth: 'secret-auth', conn: 'private-ip',
    };
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
        match: { isPlaying: () => true, updateScores: jest.fn(), recordBallKick: jest.fn() },
        players: { getPlayerList: () => new Map() },
    } as unknown as RoomRuntime;
    return { runtime, player, stop: () => { scores = null; } };
}

describe('live broadcast snapshots', () => {
    it('sends retained timeline revisions on changes and preserves the completed match through idle frames', () => {
        const send = jest.fn();
        process.send = send as typeof process.send;
        Object.defineProperty(process, 'connected', { configurable: true, value: true });
        const { runtime, stop } = fixture();
        const history = getMatchTimeline(runtime);
        history.start({ id: 1, name: 'Admin' });
        const matchId = history.getSnapshot()!.matchId;
        const message = (index: number) => send.mock.calls[index][0];
        const complete = (index: number) => (send.mock.calls[index][1] as () => void)();
        publishLiveFrame(runtime);
        expect(parseRoomWorkerMessage(message(0)).success).toBe(true);
        expect(message(0)).toMatchObject({ payload: { matchId, timeline: { revision: 1, events: [{ type: 'start' }] } } });
        // Event happens while a previous frame is still being sent.
        history.append({ type: 'pause' }, 12);
        publishLiveFrame(runtime);
        expect(send).toHaveBeenCalledTimes(1);
        complete(0);
        publishLiveFrame(runtime);
        expect(message(1)).toMatchObject({ payload: { matchId, timeline: { revision: 2, events: [{ type: 'start' }, { type: 'pause' }] } } });
        complete(1);
        publishLiveFrame(runtime);
        expect(message(2)).not.toHaveProperty('payload.timeline');
        complete(2);
        history.append({ type: 'stop', scores: { red: 1, blue: 2 } }, 12);
        stop();
        publishLiveFrame(runtime);
        expect(parseRoomWorkerMessage(message(3)).success).toBe(true);
        expect(message(3)).toMatchObject({ payload: { matchId, status: 'stopped', timeline: { endedAt: expect.any(Number), revision: 3 } } });
        complete(3);
        history.start();
        publishLiveFrame(runtime);
        expect(message(4)).toMatchObject({ payload: { matchId: history.getSnapshot()!.matchId, timeline: { revision: 1, events: [{ type: 'start' }] } } });
        expect(history.getSnapshot()!.matchId).not.toBe(matchId);
    });
    it('never publishes a transient armed press consumed by physics in the same tick', async () => {
        const send = jest.fn();
        process.send = send as typeof process.send;
        Object.defineProperty(process, 'connected', { configurable: true, value: true });
        const { runtime, player } = fixture();
        player.input = 16;
        getKickIndicator(runtime).input(player.id, true);
        // Real host order: input -> onGameTick -> successful kick -> physics ends.
        onGameTickListener(runtime);
        expect(send).not.toHaveBeenCalled();
        onPlayerBallKickListener(runtime, player);
        await Promise.resolve();
        expect(send).toHaveBeenCalledTimes(1);
        expect(send.mock.calls[0][0]).toMatchObject({ payload: { players: [{ id: player.id, kicking: false }, { kicking: false }] } });
    });

    it('does not flash when a cooldown expires and a new press is consumed in that same step', async () => {
        const send = jest.fn();
        process.send = send as typeof process.send;
        Object.defineProperty(process, 'connected', { configurable: true, value: true });
        const { runtime, player } = fixture();
        const indicator = getKickIndicator(runtime);
        indicator.setLimits(1, 1, 0);
        player.input = 16;
        indicator.input(player.id, true);
        indicator.kicked(player.id);
        indicator.input(player.id, false);
        indicator.input(player.id, true);
        onGameTickListener(runtime);
        expect(indicator.ready(player.id)).toBe(true);
        onPlayerBallKickListener(runtime, player);
        await Promise.resolve();
        expect(send.mock.calls[0][0]).toMatchObject({ payload: { players: [{ kicking: false }, { kicking: false }] } });
    });

    it('coalesces catch-up steps and preserves a genuine ready press away from the ball', async () => {
        const send = jest.fn();
        process.send = send as typeof process.send;
        Object.defineProperty(process, 'connected', { configurable: true, value: true });
        const { runtime, player } = fixture();
        player.input = 16;
        onGameTickListener(runtime);
        onGameTickListener(runtime);
        onGameTickListener(runtime);
        expect(send).not.toHaveBeenCalled();
        await Promise.resolve();
        expect(send).toHaveBeenCalledTimes(1);
        expect(send.mock.calls[0][0]).toMatchObject({ payload: { players: [{ kicking: true }, { kicking: false }] } });
        (send.mock.calls[0][1] as () => void)();
        player.input = 0;
        onGameTickListener(runtime);
        await Promise.resolve();
        expect(send.mock.calls[1][0]).toMatchObject({ payload: { players: [{ kicking: false }, { kicking: false }] } });
    });
    it('sends a dark outline after a successful kick even while shot stays held', () => {
        const send = jest.fn();
        process.send = send as typeof process.send;
        Object.defineProperty(process, 'connected', { configurable: true, value: true });
        const { runtime, player } = fixture();
        const capture = () => {
            publishLiveFrame(runtime);
            const call = send.mock.calls[send.mock.calls.length - 1];
            (call[1] as () => void)();
            return (call[0] as { payload: { players: { kicking: boolean }[] } }).payload.players[0].kicking;
        };
        player.input = 16;
        expect(capture()).toBe(true);
        getKickIndicator(runtime).kicked(player.id);
        expect(capture()).toBe(false);
        getKickIndicator(runtime).advance([player.id]);
        getKickIndicator(runtime).advance([player.id]);
        expect(capture()).toBe(false);
        player.input = 0; capture();
        player.input = 16;
        expect(capture()).toBe(true);
        runtime.match.isPlaying = () => false;
        expect(capture()).toBe(false);
    });
    it('retains goal credits across dropped snapshots and clears them when the match stops', () => {
        const send = jest.fn();
        process.send = send as typeof process.send;
        Object.defineProperty(process, 'connected', { configurable: true, value: true });
        const { runtime, stop } = fixture();
        publishLiveFrame(runtime);
        recordLiveGoal(runtime, {
            team: 1, scores: { red: 1, blue: 2 }, scorer: { id: 7, name: 'Scorer' },
            assistant: { id: 9, name: 'Assistant' }, ownGoal: false,
        });
        publishLiveFrame(runtime);
        expect(send).toHaveBeenCalledTimes(1);
        (send.mock.calls[0][1] as () => void)();
        publishLiveFrame(runtime);
        const message = send.mock.calls[1][0];
        expect(parseRoomWorkerMessage(message).success).toBe(true);
        expect(message).toMatchObject({ payload: { goal: { id: expect.any(String), scorer: { name: 'Scorer' }, assistant: { name: 'Assistant' } } } });
        (send.mock.calls[1][1] as () => void)();
        publishLiveFrame(runtime);
        expect(send.mock.calls[2][0]).toMatchObject({ payload: { goal: (message as { payload: { goal: unknown } }).payload.goal } });
        (send.mock.calls[2][1] as () => void)();
        stop();
        publishLiveFrame(runtime);
        expect(send.mock.calls[3][0]).not.toHaveProperty('payload.goal');
        (send.mock.calls[3][1] as () => void)();
        recordLiveGoal(runtime, { team: 1, scores: { red: 1, blue: 0 }, scorer: null, assistant: null, ownGoal: false });
        clearLiveGoal(runtime);
        publishLiveFrame(runtime);
        expect(send.mock.calls[4][0]).not.toHaveProperty('payload.goal');
    });
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
