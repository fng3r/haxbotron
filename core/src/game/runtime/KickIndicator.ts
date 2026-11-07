import type { RoomRuntime } from "./RoomRuntime.js";

type KickState = { held: boolean; armed: boolean; cooldown: number; budget: number; settled: boolean; tick: number; active: boolean };

/** Mirrors the native kick-ready outline using public input, kick and rate-limit events. */
export class KickIndicator {
    private players = new Map<number, KickState>();
    private min = 2;
    private rate = 0;
    private capacity = 1;
    private tick = 0;

    private player(id: number): KickState {
        let state = this.players.get(id);
        if (!state) {
            state = { held: false, armed: false, cooldown: 0, budget: 0, settled: false, tick: this.tick, active: true };
            this.players.set(id, state);
        }
        this.synchronize(state);
        return state;
    }

    private synchronize(state: KickState): void {
        const elapsed = this.tick - state.tick;
        if (elapsed > 0 && state.active) {
            state.cooldown = Math.max(0, state.cooldown - elapsed);
            if (state.budget < this.capacity) state.budget = Math.min(this.capacity, state.budget + elapsed);
            state.settled = state.armed && state.cooldown <= 0 && state.budget >= 0;
        }
        state.tick = this.tick;
    }

    setActive(id: number, active: boolean): void {
        const state = this.player(id);
        state.active = active;
        state.held = state.armed = state.settled = false;
    }

    resetInputs(): void {
        for (const state of this.players.values()) {
            this.synchronize(state);
            state.held = state.armed = state.settled = false;
        }
    }

    /** No player enumeration while delivery is disabled. Counters catch up on access. */
    advanceClock(): void { this.tick++; }

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
        const state = this.players.get(id);
        if (state) this.synchronize(state);
        return state?.settled ?? false;
    }

    setLimits(min: number, rate: number, burst: number): void {
        for (const state of this.players.values()) this.synchronize(state);
        this.min = Math.max(0, Math.min(255, min));
        this.rate = Math.max(0, Math.min(255, rate));
        this.capacity = this.rate * Math.max(0, Math.min(100, burst));
    }

    /** Called in pre-physics onGameTick, matching the host's upcoming counter update. */
    advance(activePlayerIds: number[]): void {
        for (const id of activePlayerIds) this.player(id);
        this.advanceClock();
        for (const id of activePlayerIds) {
            const state = this.player(id);
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
