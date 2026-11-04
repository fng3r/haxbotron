import { describe, expect, it } from '@jest/globals';
import { getGoalAttribution } from '../../../src/game/runtime/GoalAttribution.js';

const players = new Map([
    [1, { id: 1, name: 'Scorer', team: 1, auth: 'private-auth' }],
    [2, { id: 2, name: 'Teammate', team: 1, auth: 'private-auth' }],
    [3, { id: 3, name: 'Opponent', team: 2, auth: 'private-auth' }],
]);

describe('broadcast goal attribution', () => {
    it('copies only public scorer and teammate assist details', () => {
        expect(getGoalAttribution(players, 1, 1, 2)).toEqual({
            scorer: { id: 1, name: 'Scorer' }, assistant: { id: 2, name: 'Teammate' }, ownGoal: false,
        });
    });

    it('rejects self assists and opponent assists', () => {
        expect(getGoalAttribution(players, 1, 1, 1).assistant).toBeNull();
        expect(getGoalAttribution(players, 1, 1, 3).assistant).toBeNull();
    });

    it('labels own goals and omits their assists', () => {
        expect(getGoalAttribution(players, 1, 3, 1)).toEqual({
            scorer: { id: 3, name: 'Opponent' }, assistant: null, ownGoal: true,
        });
    });

    it('handles departed players and goals with no known scorer', () => {
        expect(getGoalAttribution(players, 1, 4, 2)).toEqual({
            scorer: { id: 4, name: 'Player#4 [LEFT]' }, assistant: null, ownGoal: false,
        });
        expect(getGoalAttribution(players, 1, 1, 4).assistant).toEqual({ id: 4, name: 'Player#4 [LEFT]' });
        expect(getGoalAttribution(players, 1, undefined, 2)).toEqual({ scorer: null, assistant: null, ownGoal: false });
    });
});
