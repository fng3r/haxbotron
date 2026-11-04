import { describe, expect, it } from '@jest/globals';
import { KickIndicator } from '../../../src/game/runtime/KickIndicator.js';

describe('native-style kick outline', () => {
    it('stays ready away from a kickable disc, then consumes the press on a successful kick', () => {
        const indicator = new KickIndicator();
        indicator.input(1, true);
        expect(indicator.ready(1)).toBe(true);
        indicator.advance([1]);
        indicator.input(1, true);
        expect(indicator.ready(1)).toBe(true);
        indicator.kicked(1);
        expect(indicator.ready(1)).toBe(false);
        for (let i = 0; i < 100; i++) { indicator.advance([1]); indicator.input(1, true); }
        expect(indicator.ready(1)).toBe(false);
        indicator.input(1, false);
        indicator.input(1, true);
        expect(indicator.ready(1)).toBe(true);
    });

    it('honors minimum cooldown when the shot button is pressed again quickly', () => {
        const indicator = new KickIndicator();
        indicator.setLimits(3, 0, 0);
        indicator.input(1, true);
        indicator.kicked(1);
        indicator.input(1, false);
        indicator.input(1, true);
        for (let i = 0; i < 3; i++) {
            expect(indicator.ready(1)).toBe(false);
            indicator.advance([1]);
        }
        expect(indicator.ready(1)).toBe(true);
        indicator.input(1, false);
        expect(indicator.ready(1)).toBe(false);
    });

    it('honors rate budgets and recovers only through active simulation ticks', () => {
        const indicator = new KickIndicator();
        indicator.setLimits(0, 4, 1);
        indicator.input(1, true);
        indicator.kicked(1);
        indicator.input(1, false);
        indicator.input(1, true);
        indicator.advance([]);
        expect(indicator.ready(1)).toBe(false);
        for (let i = 0; i < 4; i++) indicator.advance([1]);
        expect(indicator.ready(1)).toBe(true);
    });

    it('accumulates a bounded burst budget and keeps player states independent', () => {
        const indicator = new KickIndicator();
        indicator.setLimits(0, 4, 1);
        for (let i = 0; i < 100; i++) indicator.advance([1, 2]);
        for (let i = 0; i < 2; i++) {
            indicator.input(1, false); indicator.input(1, true);
            expect(indicator.ready(1)).toBe(true);
            indicator.kicked(1);
        }
        indicator.input(1, false); indicator.input(1, true);
        expect(indicator.ready(1)).toBe(false);
        indicator.input(2, true);
        expect(indicator.ready(2)).toBe(true);
        indicator.remove(1);
        expect(indicator.ready(1)).toBe(false);
    });
});
