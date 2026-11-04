import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { MatchTimeline } from '../../../src/game/runtime/MatchTimeline.js';

afterEach(() => { jest.restoreAllMocks(); });

describe('room-owned match timeline', () => {
    it('retains events without viewers and snapshots public names at the time of the event', () => {
        const history = new MatchTimeline();
        const player = { id: 7, name: 'Original name', auth: 'secret', conn: 'private' };
        history.start(player);
        const initial = history.getSnapshot()!;
        history.append({ type: 'join', player }, 10);
        player.name = 'Renamed';
        expect(initial.events).toHaveLength(1);
        expect(history.getSnapshot()!.events[1].player).toEqual({ id: 7, name: 'Original name' });
        expect(JSON.stringify(history.getSnapshot())).not.toMatch(/secret|private|auth|conn/);
        expect(history.getSnapshot()!.revision).toBe(2);
        expect(history.getSnapshot()!.events.map(event => event.time)).toEqual([0, 10]);
    });

    it('keeps goal, own-goal and assist details without retaining mutable player objects', () => {
        const history = new MatchTimeline();
        history.start();
        const scorer = { id: 1, name: 'Scorer' };
        const goal = { id: 'goal-1', team: 1 as const, scores: { red: 1, blue: 0 }, scorer,
            assistant: { id: 2, name: 'Assistant' }, ownGoal: false };
        history.append({ type: 'goal', team: 1, scores: goal.scores, goal }, 19.5);
        scorer.name = 'Changed'; goal.scores.red = 99;
        expect(history.getSnapshot()!.events[1]).toMatchObject({
            time: 19.5, scores: { red: 1, blue: 0 }, goal: { scorer: { name: 'Scorer' }, assistant: { name: 'Assistant' } },
        });
        history.append({ type: 'goal', team: 2, goal: { ...goal, ownGoal: true, assistant: null } }, 20);
        expect(history.getSnapshot()!.events[2].goal?.ownGoal).toBe(true);
    });

    it('retains the final result and ignores events before kickoff or after full time', () => {
        const history = new MatchTimeline();
        expect(history.append({ type: 'join' }, 0)).toBe(false);
        history.start();
        history.append({ type: 'pause' }, 30);
        history.append({ type: 'resume' }, 29); // Never move backwards on a clock fallback.
        history.append({ type: 'victory', team: 1, scores: { red: 3, blue: 1 } }, 90);
        const final = history.getSnapshot()!;
        expect(final.endedAt).not.toBeNull();
        expect(final.events.map(event => event.time)).toEqual([0, 30, 30, 90]);
        expect(history.append({ type: 'stop' }, 90)).toBe(false);
        expect(history.append({ type: 'leave' }, 90)).toBe(false);
        expect(history.getSnapshot()).toBe(final);
    });

    it('resets for every new match, including matches started at the same millisecond', () => {
        jest.spyOn(Date, 'now').mockReturnValue(1000);
        const history = new MatchTimeline();
        history.start();
        history.append({ type: 'stop', scores: { red: 1, blue: 0 } }, 5);
        const old = history.getSnapshot()!;
        history.start();
        const current = history.getSnapshot()!;
        expect(current.matchId).not.toBe(old.matchId);
        expect(current.events).toHaveLength(1);
        expect(current.events[0].type).toBe('start');
        expect(current.revision).toBe(1);
        expect(current.endedAt).toBeNull();
        expect(old.events).toHaveLength(2);
    });
});
