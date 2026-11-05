import { describe, expect, it, jest } from '@jest/globals';
import { readFileSync } from 'node:fs';
import type { RoomObject } from 'haxball.js';
import type { LiveStadium } from '../../../src/lib/room/LiveProtocol.js';
import { decodeReplayStadium } from '../../../src/game/services/ReplayStadium.js';
import { RoomService } from '../../../src/game/services/RoomService.js';
import { parseLiveStadium } from '../../../src/game/runtime/LiveBroadcast.js';

const customReplay = readFileSync(new URL('../../fixtures/replay/custom.hbr2', import.meta.url));
const classicReplay = readFileSync(new URL('../../fixtures/replay/classic.hbr2', import.meta.url));
const customHbs = readFileSync(new URL('../../fixtures/replay/custom.hbs', import.meta.url), 'utf8');

function fixture(decodeStadium = decodeReplayStadium) {
    const native = {
        getScores: jest.fn<() => object | null>().mockReturnValue(null),
        setCustomStadium: jest.fn(),
        startRecording: jest.fn(),
        stopRecording: jest.fn<() => Uint8Array | null>().mockReturnValue(customReplay),
    };
    const onStadiumError = jest.fn();
    const service = new RoomService(native as unknown as RoomObject, { decodeStadium, onStadiumError });
    return { native, service, onStadiumError };
}

describe('stadium extraction from native HBR2 recordings', () => {
    it('decodes a real zero-frame custom replay into renderable public geometry', async () => {
        const stadium = (await decodeReplayStadium(customReplay))!;
        const source = parseLiveStadium(customHbs);
        expect(stadium).toMatchObject({ name: source.name, width: source.width, height: source.height,
            vertexes: source.vertexes, goals: source.goals,
            bg: { type: 'hockey', width: 450, height: 200, kickOffRadius: 65, cornerRadius: 20, color: 0x34414b },
        });
        expect(stadium.segments).toEqual([
            { v0: 0, v1: 1, vis: true, color: 0xabcdef },
            { v0: 1, v1: 2, vis: true, color: 0x112233, curveF: expect.closeTo(1 / Math.tan(Math.PI / 6)) },
            { v0: 2, v1: 3, vis: false, color: 0 },
        ]);
        expect(parseLiveStadium(JSON.stringify(stadium))).toEqual(stadium);
        expect(stadium).not.toHaveProperty('players');
        expect(stadium).not.toHaveProperty('roomData');
    });

    it('recognizes ID-only native built-ins and rejects malformed replays', async () => {
        expect(await decodeReplayStadium(classicReplay)).toBeNull();
        await expect(decodeReplayStadium(Buffer.from('invalid'))).rejects.toThrow();
    });

    it('captures synchronously, then replaces the fallback with decoded geometry', async () => {
        const { native, service, onStadiumError } = fixture();
        const pending = service.observeStadiumChange('Replay geometry fixture');
        expect(native.startRecording).toHaveBeenCalledTimes(1);
        expect(native.stopRecording).toHaveBeenCalledTimes(1);
        expect(JSON.parse(service.getStadiumSource()!)).toMatchObject({ approximate: true });
        await pending;
        expect(JSON.parse(service.getStadiumSource()!)).toMatchObject({ width: 500, height: 250 });
        expect(JSON.parse(service.getStadiumSource()!)).not.toHaveProperty('approximate');
        expect(onStadiumError).not.toHaveBeenCalled();
    });

    it('never interrupts match recordings, even between the stop event and replay collection', async () => {
        const decode = jest.fn(decodeReplayStadium);
        const { native, service } = fixture(decode);
        service.startMatchRecording();
        // Scores may already be null while the final replay is still owned by the match.
        await service.observeStadiumChange('Replay geometry fixture');
        expect(native.startRecording).toHaveBeenCalledTimes(1);
        expect(native.stopRecording).not.toHaveBeenCalled();
        expect(decode).not.toHaveBeenCalled();
        expect(service.stopMatchRecording()).toBe(customReplay);
        expect(native.stopRecording).toHaveBeenCalledTimes(1);
        await service.observeStadiumChange('Replay geometry fixture');
        expect(native.startRecording).toHaveBeenCalledTimes(2);
        expect(native.stopRecording).toHaveBeenCalledTimes(2);
    });

    it('does not probe a running game even if another caller started it', async () => {
        const { native, service } = fixture();
        native.getScores.mockReturnValue({ red: 0, blue: 0 });
        await service.observeStadiumChange('Replay geometry fixture');
        expect(native.startRecording).not.toHaveBeenCalled();
        expect(native.stopRecording).not.toHaveBeenCalled();
    });

    it('discards out-of-order results even when consecutive maps have the same name', async () => {
        const complete: ((stadium: LiveStadium) => void)[] = [];
        const { service } = fixture(() => new Promise(resolve => complete.push(resolve)));
        const first = service.observeStadiumChange('Same name');
        const second = service.observeStadiumChange('Same name');
        complete[1]({ name: 'Same name', width: 800, height: 400 });
        await second;
        complete[0]({ name: 'Same name', width: 100, height: 50 });
        await first;
        expect(JSON.parse(service.getStadiumSource()!)).toMatchObject({ width: 800 });
    });

    it('does not overwrite a newly requested bot map with an older extraction result', async () => {
        let complete!: (stadium: LiveStadium) => void;
        const { service } = fixture(() => new Promise(resolve => { complete = resolve; }));
        const pending = service.observeStadiumChange('Previous map');
        service.setCustomStadium(customHbs);
        complete({ name: 'Previous map', width: 100, height: 50 });
        await pending;
        expect(service.getStadiumSource()).toBe(customHbs);
    });

    it('keeps bot-loaded geometry on decoder failure and logs the failure', async () => {
        const error = new Error('Decoder unavailable');
        const { service, onStadiumError } = fixture(async () => { throw error; });
        service.setCustomStadium(customHbs);
        await service.observeStadiumChange('Replay geometry fixture');
        expect(service.getStadiumSource()).toBe(customHbs);
        expect(onStadiumError).toHaveBeenCalledWith(error);
    });

    it('uses a fresh bundled fallback when a native built-in replaces a same-name custom map', async () => {
        const { native, service } = fixture();
        service.setCustomStadium(customHbs.replace('Replay geometry fixture', 'Classic'));
        await service.observeStadiumChange('Classic');
        native.stopRecording.mockReturnValue(classicReplay);
        await service.observeStadiumChange('Classic');
        expect(JSON.parse(service.getStadiumSource()!)).toMatchObject({ name: 'Classic', width: 420 });
    });

    it('retains the approximate fallback if recording returns no data or the wrong stadium', async () => {
        const { native, service, onStadiumError } = fixture();
        native.stopRecording.mockReturnValue(null);
        await service.observeStadiumChange('Missing');
        expect(onStadiumError).toHaveBeenCalledTimes(1);
        native.stopRecording.mockReturnValue(customReplay);
        await service.observeStadiumChange('Wrong stadium');
        expect(onStadiumError).toHaveBeenCalledTimes(2);
        expect(JSON.parse(service.getStadiumSource()!)).toMatchObject({ name: 'Wrong stadium', approximate: true });
    });
});
