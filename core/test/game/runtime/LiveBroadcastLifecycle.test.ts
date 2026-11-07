import { parseRoomWorkerMessage } from '../../../src/lib/room/RoomProtocol.js';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type { RoomRuntime } from '../../../src/game/runtime/RoomRuntime.js';
import type { ScoresObject, RoomObject } from 'haxball.js';
import { configureLiveBroadcast } from '../../../src/game/runtime/LiveBroadcastLifecycle.js';
import { RoomService } from '../../../src/game/services/RoomService.js';
import { onGameTickListener } from '../../../src/game/controller/events/onGameTick.js';
import { onPlayerBallKickListener } from '../../../src/game/controller/events/onPlayerBallKick.js';
import { publishLiveFrame, publishLiveKick, recordLiveMatchEvent, recordLiveGoal, startLiveMatch, scheduleLiveFrame } from '../../../src/game/runtime/LiveBroadcast.js';
import { readFileSync } from 'node:fs';
import { getKickIndicator } from '../../../src/game/runtime/KickIndicator.js';
import { getMatchTimeline } from '../../../src/game/runtime/MatchTimeline.js';

const originalSend = process.send;
const originalConnected = Object.getOwnPropertyDescriptor(process, 'connected');
afterEach(() => { process.send = originalSend; jest.useRealTimers();
    if (originalConnected) Object.defineProperty(process, 'connected', originalConnected);
    else delete (process as { connected?: boolean }).connected; });
function fixture() {
    const settings = { liveBroadcast: false };
    const native = {
        getScores: jest.fn<() => ScoresObject | null>(() => ({ red: 0, blue: 0, time: 20, scoreLimit: 3, timeLimit: 300 })),
        getPlayerList: jest.fn(() => []),
        getDiscCount: jest.fn(() => 0), getDiscProperties: jest.fn(),
        getPlayerDiscProperties: jest.fn(), InputFlags: { kick: 16 },
        setCustomStadium: jest.fn(),
        startRecording: jest.fn(), stopRecording: jest.fn(() => readFileSync(new URL('../../fixtures/replay/custom.hbr2', import.meta.url))),
        onPlayerInput: null, onKickRateLimitSet: null,
    };
    const room = new RoomService(native as unknown as RoomObject);
    const runtime = { config: { getSettings: () => settings }, room,
        match: { isPlaying: () => true, updateScores: jest.fn(), recordBallKick: jest.fn() },
        players: { getPlayerList: () => new Map() },
    } as unknown as RoomRuntime;
    return { runtime, native, settings };
}

describe('optional live broadcaster', () => {
    it('does no snapshot, player enumeration or broadcast IPC work when disabled', async () => {
        const { runtime, native } = fixture();
        const send = jest.fn(); process.send = send as typeof process.send;
        onGameTickListener(runtime);
        onPlayerBallKickListener(runtime, { id: 1, name: 'Player', team: 1, input: 16 } as never);
        scheduleLiveFrame(runtime); publishLiveFrame(runtime); publishLiveKick(runtime, 1);
        recordLiveMatchEvent(runtime, { type: 'pause' });
        await Promise.resolve();
        expect(native.getPlayerList).not.toHaveBeenCalled();
        expect(native.getDiscCount).not.toHaveBeenCalled();
        expect(native.getPlayerDiscProperties).not.toHaveBeenCalled();
        expect(send).not.toHaveBeenCalled();
        expect(runtime.match.updateScores).toHaveBeenCalledWith(0, 0, 20);
        expect(runtime.match.recordBallKick).toHaveBeenCalledTimes(1);
    });
    it('toggles one heartbeat while keeping event handlers and match history', async () => {
        jest.useFakeTimers();
        const { runtime, native, settings } = fixture();
        configureLiveBroadcast(runtime, false);
        expect(jest.getTimerCount()).toBe(0);
        startLiveMatch(runtime, null);
        const history = getMatchTimeline(runtime).getSnapshot();
        configureLiveBroadcast(runtime, true);
        expect(settings.liveBroadcast).toBe(true);
        expect(native.onPlayerInput).toEqual(expect.any(Function));
        expect(native.onKickRateLimitSet).toEqual(expect.any(Function));
        expect(getMatchTimeline(runtime).getSnapshot()).toBe(history);
        expect(jest.getTimerCount()).toBe(2); // heartbeat + scheduled snapshot microtask
        configureLiveBroadcast(runtime, false);
        jest.runAllTicks();
        expect(native.onPlayerInput).toEqual(expect.any(Function));
        expect(native.onKickRateLimitSet).toEqual(expect.any(Function));
        expect(jest.getTimerCount()).toBe(0);
        expect(native.stopRecording).not.toHaveBeenCalled();
        expect(settings.liveBroadcast).toBe(false);
        configureLiveBroadcast(runtime, true);
        configureLiveBroadcast(runtime, true);
        jest.runAllTicks();
        expect(jest.getTimerCount()).toBe(1);
        configureLiveBroadcast(runtime, false);
    });
    it('captures and retains real stadium geometry while disabled without interrupting match recording', async () => {
        const { runtime, native } = fixture();
        native.getScores.mockReturnValue(null);
        await runtime.room.observeStadiumChange('Replay geometry fixture');
        expect(JSON.parse(runtime.room.getStadiumSource()!)).toMatchObject({ width: 500, height: 250 });
        expect(native.startRecording).toHaveBeenCalledTimes(1);
        expect(native.stopRecording).toHaveBeenCalledTimes(1);
        runtime.room.startMatchRecording();
        runtime.room.stopMatchRecording();
        expect(native.startRecording).toHaveBeenCalledTimes(2);
        expect(native.stopRecording).toHaveBeenCalledTimes(2);
    });
    it('sends the complete retained timeline and stadium in the first frame after enabling', async () => {
        const { runtime, native } = fixture();
        const send = jest.fn(); process.send = send as typeof process.send;
        Object.defineProperty(process, 'connected', { configurable: true, value: true });
        configureLiveBroadcast(runtime, false);
        native.getScores.mockReturnValue(null);
        await runtime.room.observeStadiumChange('Replay geometry fixture');
        native.getScores.mockReturnValue({ red: 1, blue: 0, time: 20, scoreLimit: 3, timeLimit: 300 });
        startLiveMatch(runtime, { id: 1, name: 'Admin' });
        const matchId = getMatchTimeline(runtime).getSnapshot()!.matchId;
        recordLiveGoal(runtime, { team: 1, scores: { red: 1, blue: 0 }, ownGoal: false,
            scorer: { id: 2, name: 'Scorer' }, assistant: { id: 3, name: 'Assistant' } });
        recordLiveMatchEvent(runtime, { type: 'pause' });
        recordLiveMatchEvent(runtime, { type: 'resume' });
        const retained = getMatchTimeline(runtime).getSnapshot();
        expect(send.mock.calls.filter(([message]) => (message as { event: string }).event === 'live')).toHaveLength(0);
        configureLiveBroadcast(runtime, true);
        await Promise.resolve();
        const frame = send.mock.calls.map(([message]) => message as { event: string; payload: unknown }).find(m => m.event === 'live');
        expect(parseRoomWorkerMessage(frame).success).toBe(true);
        expect(frame).toMatchObject({ payload: { matchId, scores: { red: 1 },
            stadium: { name: 'Replay geometry fixture', width: 500 }, timeline: retained } });
        expect(retained!.events.map(event => event.type)).toEqual(['start', 'goal', 'pause', 'resume']);
        configureLiveBroadcast(runtime, false);
        recordLiveMatchEvent(runtime, { type: 'stop', scores: { red: 1, blue: 0 } });
        configureLiveBroadcast(runtime, true);
        expect(getMatchTimeline(runtime).getSnapshot()!.matchId).toBe(matchId);
        expect(getMatchTimeline(runtime).getSnapshot()!.endedAt).not.toBeNull();
        configureLiveBroadcast(runtime, false);
        startLiveMatch(runtime, null);
        expect(getMatchTimeline(runtime).getSnapshot()!.matchId).not.toBe(matchId);
        expect(getMatchTimeline(runtime).getSnapshot()!.events).toHaveLength(1);
    });
    it('keeps consumed shot presses and rate limits across delivery toggles', () => {
        const { runtime } = fixture();
        configureLiveBroadcast(runtime, false);
        const tracker = getKickIndicator(runtime);
        tracker.setLimits(6, 12, 4);
        tracker.input(7, true);
        onGameTickListener(runtime);
        tracker.kicked(7);
        for (let i = 0; i < 30; i++) onGameTickListener(runtime);
        configureLiveBroadcast(runtime, true);
        expect(getKickIndicator(runtime)).toBe(tracker);
        expect(tracker.settledReady(7)).toBe(false);
        configureLiveBroadcast(runtime, false);
        tracker.input(7, false);
        tracker.input(7, true);
        onGameTickListener(runtime);
        expect(tracker.settledReady(7)).toBe(true);
    });

});
