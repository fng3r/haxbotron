import { describe, expect, it } from '@jest/globals';
import { DefaultAvatars, getDefaultAvatars } from '../../../src/game/runtime/DefaultAvatars.js';
import type { RoomRuntime } from '../../../src/game/runtime/RoomRuntime.js';

describe('native default avatar numbering', () => {
    it('numbers each team independently in room-list order rather than by player ID', () => {
        const avatars = new DefaultAvatars();
        avatars.reset([{ id: 55, team: 1 }, { id: 8, team: 0 }, { id: 49, team: 2 },
            { id: 3, team: 1 }, { id: 1, team: 2 }]);
        expect([55, 49, 3, 1, 8].map(id => avatars.number(id))).toEqual([1, 1, 2, 2, 0]);
    });
    it('does not renumber survivors, and fills the lowest free number on a team change', () => {
        const avatars = new DefaultAvatars();
        avatars.reset([{ id: 10, team: 1 }, { id: 20, team: 1 }, { id: 30, team: 1 }, { id: 40, team: 2 }]);
        avatars.remove(20);
        expect(avatars.number(30)).toBe(3);
        avatars.change(50, 1);
        expect(avatars.number(50)).toBe(2);
        avatars.change(10, 2);
        expect(avatars.number(10)).toBe(2);
        expect(avatars.number(40)).toBe(1);
        expect(avatars.number(30)).toBe(3);
        avatars.change(60, 1);
        expect(avatars.number(60)).toBe(1);
        avatars.change(30, 1);
        expect(avatars.number(30)).toBe(3);
    });
    it('reassigns sequential numbers on a goal-position reset or new game, and clears on stop', () => {
        const avatars = new DefaultAvatars();
        avatars.reset([{ id: 10, team: 1 }, { id: 20, team: 1 }, { id: 30, team: 1 }]);
        avatars.remove(10);
        expect(avatars.number(20)).toBe(2);
        avatars.reset([{ id: 30, team: 1 }, { id: 20, team: 1 }]);
        expect(avatars.number(30)).toBe(1);
        expect(avatars.number(20)).toBe(2);
        avatars.clear();
        expect(avatars.number(30)).toBeUndefined();
    });
    it('retains assignments per runtime for late viewers, reconnects and broadcast toggles', () => {
        const runtime = {} as RoomRuntime;
        getDefaultAvatars(runtime).reset([{ id: 55, team: 1 }]);
        expect(getDefaultAvatars(runtime).number(55)).toBe(1);
        expect(getDefaultAvatars({} as RoomRuntime).number(55)).toBeUndefined();
    });
});
