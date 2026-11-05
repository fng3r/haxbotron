import type { LiveStadium } from "../../lib/room/LiveProtocol.js";

export type ReplayStadiumDecoder = (replay: Uint8Array) => Promise<LiveStadium | null>;

/** Decode only public geometry; never forward replay room/player data to viewers. */
export const decodeReplayStadium: ReplayStadiumDecoder = async (replay) => {
    // Load lazily so an unavailable native decoder cannot prevent a room opening.
    const { decodeAsync } = await import("@hax-brasil/replay-decoder");
    const { roomData: { stadium } } = await decodeAsync(replay);
    // Native built-ins encode an ID rather than geometry. Keep the bundled lookup.
    if (stadium.defaultStadiumId !== 255) return null;
    if (!stadium.name || !Number.isFinite(stadium.width) || !Number.isFinite(stadium.height)
        || stadium.width! <= 0 || stadium.height! <= 0) {
        throw new Error("Replay stadium has invalid dimensions or name");
    }
    return {
        name: stadium.name, width: stadium.width!, height: stadium.height!,
        bg: {
            type: typeof stadium.backgroundType === "string" ? stadium.backgroundType : "none",
            width: stadium.backgroundWidth ?? 0, height: stadium.backgroundHeight ?? 0,
            kickOffRadius: stadium.backgroundKickoffRadius ?? 0,
            cornerRadius: stadium.backgroundCornerRadius ?? 0,
            goalLine: stadium.backgroundGoalLine ?? 0,
            color: stadium.backgroundColor ?? 0x718c5a,
        },
        vertexes: stadium.vertices.map(v => ({ x: v.pos.x, y: v.pos.y })),
        segments: stadium.segments.map(s => ({
            v0: s.v0, v1: s.v1, vis: s.vis, color: s.color,
            // Replay stores cot(angle/2), not HBS degrees. Infinity becomes null
            // in the decoder's JSON output for straight segments.
            ...(Number.isFinite(s.curve) ? { curveF: s.curve } : {}),
        })),
        goals: stadium.goals.map(g => ({
            p0: [g.p0.x, g.p0.y], p1: [g.p1.x, g.p1.y], team: g.teamId === 1 ? "red" : "blue",
        })),
    };
};
