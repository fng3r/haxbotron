import JSON5 from "json5";
import type { RoomRuntime } from "./RoomRuntime.js";
import type { LiveDisc, LiveFrame, LiveStadium } from "../../lib/room/LiveProtocol.js";

const states = new WeakMap<RoomRuntime, { sequence: number; source: string | null; stadium?: LiveStadium; busy: boolean }>();

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
    const pick = (d: ReturnType<typeof room.getDiscProperties>): LiveDisc | null => d ? ({
        x: d.x, y: d.y, radius: d.radius, color: d.color,
    }) : null;
    const frame: LiveFrame = {
        sequence: ++state.sequence, timestamp: Date.now(),
        status: !scores ? "stopped" : runtime.match.isPlaying() ? "playing" : "paused",
        scores,
        discs: scores ? Array.from({ length: room.getDiscCount() }, (_, i) => pick(room.getDiscProperties(i))) : [],
        players: room.getPlayerList().map(p => ({ id: p.id, name: p.name, team: p.team,
            kicking: !!scores && p.team !== 0 && (p.input & room.InputFlags.kick) !== 0,
            disc: scores && p.team !== 0 ? pick(room.getPlayerDiscProperties(p.id)) : null })),
        ...(stadium ? { stadium } : {}),
    };
    state.busy = true;
    process.send({ type: "event", event: "live", payload: frame }, () => { state!.busy = false; });
}
