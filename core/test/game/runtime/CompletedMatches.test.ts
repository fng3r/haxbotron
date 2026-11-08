import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type { RoomRuntime } from '../../../src/game/runtime/RoomRuntime.js';
import { getMatchTimeline } from '../../../src/game/runtime/MatchTimeline.js';
import { publishCompletedMatch } from '../../../src/game/runtime/CompletedMatches.js';
import { parseRoomWorkerMessage } from '../../../src/lib/room/RoomProtocol.js';

const originalSend = process.send;
afterEach(() => { process.send = originalSend; });
function fixture() {
    const stats = { scores: { red: 0, blue: 0, time: 80 }, startingLineup: {
        red: [{ id: 1, name: 'Red starter', auth: 'SECRET', conn: 'PRIVATE' }],
        blue: [{ id: 2, name: 'Blue starter', admin: true }],
    } };
    const runtime = { config: { getSettings: () => ({ liveBroadcast: false }) },
        match: { getMatchStats: () => stats },
    } as unknown as RoomRuntime;
    const timeline = getMatchTimeline(runtime);
    timeline.start({ id: 3, name: 'Admin' });
    return { runtime, timeline, stats };
}
describe('completed match publication', () => {
    it('emits one sanitized record even with broadcasting disabled and no viewers', () => {
        const send = jest.fn(); process.send = send as typeof process.send;
        const { runtime, timeline } = fixture();
        timeline.append({ type: 'goal', team: 1, scores: { red: 1, blue: 0 } }, 81);
        timeline.append({ type: 'victory', team: 1, scores: { red: 1, blue: 0 } }, 90);
        publishCompletedMatch(runtime);
        publishCompletedMatch(runtime);
        expect(send).toHaveBeenCalledTimes(1);
        expect(parseRoomWorkerMessage(send.mock.calls[0][0]).success).toBe(true);
        expect(send.mock.calls[0][0]).toMatchObject({ event: 'matchCompleted', payload: {
            outcome: 'victory', playtime: 90, scores: { red: 1, blue: 0 },
            startingLineups: { red: [{ id: 1, name: 'Red starter' }], blue: [{ id: 2, name: 'Blue starter' }] },
            events: [{ type: 'start' }, { type: 'goal' }, { type: 'victory' }],
        } });
        expect(JSON.stringify(send.mock.calls[0][0])).not.toMatch(/SECRET|PRIVATE|auth|conn|admin/);
        timeline.start();
        timeline.append({ type: 'stop', scores: { red: 0, blue: 0 } }, 5);
        publishCompletedMatch(runtime);
        expect(send).toHaveBeenCalledTimes(2);
        expect(send.mock.calls[1][0]).toMatchObject({ payload: { outcome: 'stopped' } });
    });
});
