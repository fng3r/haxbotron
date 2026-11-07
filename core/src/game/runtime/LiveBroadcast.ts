import { isBroadcastEnabled } from "./BroadcastSettings.js";
import JSON5 from "json5";
import { randomUUID } from "node:crypto";
import { sendWorkerMessage } from "./WorkerEventBridge.js";
import { getKickIndicator } from "./KickIndicator.js";
import { getMatchTimeline, type MatchEventInput } from "./MatchTimeline.js";
import type { RoomRuntime } from "./RoomRuntime.js";
import type { LiveDisc, LiveFrame, LiveGoal, LiveStadium } from "../../lib/room/LiveProtocol.js";

const states = new WeakMap<RoomRuntime, { sequence: number; source: string | null; stadium?: LiveStadium; busy: boolean; timelineRevision?: number; timelineMatchId?: string }>();
const latestGoals = new WeakMap<RoomRuntime, LiveGoal>();
const pendingFrames = new WeakSet<RoomRuntime>();

/** Transient audio event: reliable transport, never stored in frame/history caches. */
export function publishLiveKick(runtime: RoomRuntime, playerId: number): void {
    if (!isBroadcastEnabled(runtime)) return;
    if (!process.send || !process.connected) return;
    sendWorkerMessage({ type: "event", event: "liveKick", payload: {
        id: randomUUID(), timestamp: Date.now(), playerId,
        matchId: getMatchTimeline(runtime).getSnapshot()?.matchId ?? null,
    } });
}

/** onGameTick runs before physics. Snapshot after the synchronous simulation batch settles. */
export function scheduleLiveFrame(runtime: RoomRuntime): void {
    if (!isBroadcastEnabled(runtime)) return;
    if (pendingFrames.has(runtime)) return;
    pendingFrames.add(runtime);
    queueMicrotask(() => {
        pendingFrames.delete(runtime);
        publishLiveFrame(runtime);
    });
}

export function recordLiveGoal(runtime: RoomRuntime, goal: Omit<LiveGoal, "id">): void {
    const recorded = { ...goal, id: randomUUID() };
    latestGoals.set(runtime, recorded);
    recordLiveMatchEvent(runtime, { type: "goal", team: goal.team, scores: goal.scores, goal: recorded });
}

export function startLiveMatch(runtime: RoomRuntime, actor: { id: number; name: string } | null): void {
    getMatchTimeline(runtime).start(actor);
    scheduleLiveFrame(runtime);
}

export function recordLiveMatchEvent(runtime: RoomRuntime, event: MatchEventInput): void {
    const history = getMatchTimeline(runtime);
    const snapshot = history.getSnapshot();
    if (!snapshot || snapshot.endedAt !== null) return;
    const time = runtime.room.getRoom().getScores()?.time ?? runtime.match.getMatchStats().scores.time;
    if (history.append(event, time)) scheduleLiveFrame(runtime);
}

export function clearLiveGoal(runtime: RoomRuntime): void {
    latestGoals.delete(runtime);
}

/** Extract only geometry from the loaded HBS. Traits are resolved before transmission. */
export function parseLiveStadium(source: string): LiveStadium {
    const raw = JSON5.parse(source);
    return {
        approximate: raw.approximate,
        name: raw.name, width: raw.width, height: raw.height,
        bg: raw.bg,
        vertexes: raw.vertexes?.map((v: { x: number; y: number }) => ({ x: v.x, y: v.y })),
        segments: raw.segments?.map((s: { trait?: string }) => {
            const v = { ...raw.traits?.[s.trait ?? ""], ...s };
            return { v0: v.v0, v1: v.v1, vis: v.vis, color: v.color, curve: v.curve, curveF: v.curveF };
        }),
        goals: raw.goals?.map((g: { p0: number[]; p1: number[]; team: string }) => ({ p0: g.p0, p1: g.p1, team: g.team })),
    };
}

export function publishLiveFrame(runtime: RoomRuntime): void {
    if (!isBroadcastEnabled(runtime)) return;
    if (!process.send || !process.connected) return;
    let state = states.get(runtime);
    if (!state) {
        state = { sequence: 0, source: null, busy: false };
        states.set(runtime, state);
    }
    // Drop snapshots under IPC backpressure instead of holding up the simulation.
    if (state.busy) return;
    const source = runtime.room.getStadiumSource();
    let stadium: LiveStadium | undefined;
    if (source && source !== state.source) {
        try { stadium = parseLiveStadium(source); } catch { /* unavailable geometry */ }
        state.source = source;
        state.stadium = stadium;
    }
    const room = runtime.room.getRoom();
    const scores = room.getScores();
    if (!scores) latestGoals.delete(runtime);
    const goal = latestGoals.get(runtime);
    const timeline = getMatchTimeline(runtime).getSnapshot();
    const timelineChanged = timeline && (timeline.matchId !== state.timelineMatchId || timeline.revision !== state.timelineRevision);
    const indicator = getKickIndicator(runtime);
    const players = room.getPlayerList();
    const pick = (d: ReturnType<typeof room.getDiscProperties>): LiveDisc | null => d ? ({
        x: d.x, y: d.y, radius: d.radius, color: d.color,
    }) : null;
    const frame: LiveFrame = {
        sequence: ++state.sequence, timestamp: Date.now(),
        status: !scores ? "stopped" : runtime.match.isPlaying() ? "playing" : "paused",
        scores,
        discs: scores ? Array.from({ length: room.getDiscCount() }, (_, i) => pick(room.getDiscProperties(i))) : [],
        players: players.map(p => ({ id: p.id, name: p.name, team: p.team,
            kicking: !!scores && runtime.match.isPlaying() && p.team !== 0 && indicator.settledReady(p.id),
            disc: scores && p.team !== 0 ? pick(room.getPlayerDiscProperties(p.id)) : null })),
        ...(stadium ? { stadium } : {}),
        ...(goal ? { goal } : {}),
        matchId: timeline?.matchId ?? null,
        ...(timelineChanged ? { timeline } : {}),
    };
    state.timelineMatchId = timeline?.matchId;
    state.timelineRevision = timeline?.revision;
    state.busy = true;
    process.send({ type: "event", event: "live", payload: frame }, () => { state!.busy = false; });
}

export function resetLiveBroadcast(runtime: RoomRuntime): void {
    states.delete(runtime);
}
