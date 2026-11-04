import { randomUUID } from "node:crypto";
import type { LiveMatchEvent, LiveMatchTimeline } from "../../lib/room/LiveProtocol.js";
import type { RoomRuntime } from "./RoomRuntime.js";

export type MatchEventInput = Omit<LiveMatchEvent, "id" | "time" | "timestamp">;

/** The room owns one match history, independent of viewers and browser lifetimes. */
export class MatchTimeline {
    private snapshot: LiveMatchTimeline | null = null;

    start(actor?: { id: number; name: string } | null): void {
        const now = Date.now();
        this.snapshot = { matchId: randomUUID(), startedAt: now, endedAt: null, revision: 1,
            events: [{ id: randomUUID(), type: "start", time: 0, timestamp: now,
                ...(actor ? { actor: { id: actor.id, name: actor.name } } : {}) }] };
    }

    append(input: MatchEventInput, time: number): boolean {
        const previous = this.snapshot;
        if (!previous || previous.endedAt !== null) return false;
        const timestamp = Date.now();
        const event: LiveMatchEvent = {
            id: randomUUID(), type: input.type, timestamp,
            time: Math.max(0, time, previous.events[previous.events.length - 1]?.time ?? 0),
            ...(input.actor ? { actor: { id: input.actor.id, name: input.actor.name } } : {}),
            ...(input.player ? { player: { id: input.player.id, name: input.player.name } } : {}),
            ...(input.team !== undefined ? { team: input.team } : {}),
            ...(input.scores ? { scores: { red: input.scores.red, blue: input.scores.blue } } : {}),
            ...(input.goal ? { goal: { id: input.goal.id, team: input.goal.team, ownGoal: input.goal.ownGoal,
                scores: { ...input.goal.scores },
                scorer: input.goal.scorer ? { id: input.goal.scorer.id, name: input.goal.scorer.name } : null,
                assistant: input.goal.assistant ? { id: input.goal.assistant.id, name: input.goal.assistant.name } : null,
            } } : {}),
        };
        this.snapshot = { ...previous, revision: previous.revision + 1,
            endedAt: input.type === "stop" || input.type === "victory" ? timestamp : null,
            events: [...previous.events, event] };
        return true;
    }

    getSnapshot(): LiveMatchTimeline | null { return this.snapshot; }
}

const histories = new WeakMap<RoomRuntime, MatchTimeline>();

export function getMatchTimeline(runtime: RoomRuntime): MatchTimeline {
    let history = histories.get(runtime);
    if (!history) { history = new MatchTimeline(); histories.set(runtime, history); }
    return history;
}
