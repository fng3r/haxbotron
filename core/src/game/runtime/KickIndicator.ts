import type { RoomRuntime } from "./RoomRuntime.js";

type KickState = { held: boolean; armed: boolean; cooldown: number; budget: number; settled: boolean };

/** Mirrors the native kick-ready outline using public input, kick and rate-limit events. */
export class KickIndicator {
    private players = new Map<number, KickState>();
    private min = 2;
    private rate = 0;
    private capacity = 1;

    private player(id: number): KickState {
        let state = this.players.get(id);
        if (!state) {
            state = { held: false, armed: false, cooldown: 0, budget: 0, settled: false };
            this.players.set(id, state);
        }
        return state;
    }

    input(id: number, held: boolean): void {
        const state = this.player(id);
        if (held && !state.held) state.armed = true;
        if (!held) state.armed = false;
        state.held = held;
    }

    kicked(id: number): void {
        const state = this.player(id);
        state.armed = false;
        state.settled = false;
        state.cooldown = this.min;
        state.budget -= this.rate;
    }

    ready(id: number): boolean {
        const state = this.player(id);
        return state.armed && state.cooldown <= 0 && state.budget >= 0;
    }

    /** Readiness belonging to the latest physics step, excluding later inputs. */
    settledReady(id: number): boolean {
        return this.players.get(id)?.settled ?? false;
    }

    setLimits(min: number, rate: number, burst: number): void {
        this.min = Math.max(0, Math.min(255, min));
        this.rate = Math.max(0, Math.min(255, rate));
        this.capacity = this.rate * Math.max(0, Math.min(100, burst));
    }

    /** Called in pre-physics onGameTick, matching the host's upcoming counter update. */
    advance(activePlayerIds: number[]): void {
        for (const id of activePlayerIds) {
            const state = this.player(id);
            if (state.cooldown > 0) state.cooldown--;
            if (state.budget < this.capacity) state.budget++;
            // Physics may consume this press via kicked() before the deferred
            // frame is sent. Inputs applied after this step belong to the next
            // tick and must not change the outline of this step's positions.
            state.settled = this.ready(id);
        }
    }

    remove(id: number): void { this.players.delete(id); }
}

const indicators = new WeakMap<RoomRuntime, KickIndicator>();

export function getKickIndicator(runtime: RoomRuntime): KickIndicator {
    let indicator = indicators.get(runtime);
    if (!indicator) { indicator = new KickIndicator(); indicators.set(runtime, indicator); }
    return indicator;
}
