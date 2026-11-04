import type { LiveGoal } from "../../lib/room/LiveProtocol.js";

type Player = { id: number; name: string; team: number };

/** Use the same consumed touches as match statistics, never consume them twice. */
export function getGoalAttribution(
    players: { get(id: number): Player | undefined }, team: number, scorer?: number, assistant?: number
): Pick<LiveGoal, "scorer" | "assistant" | "ownGoal"> {
    const scoringPlayer = scorer === undefined ? undefined : players.get(scorer);
    const ownGoal = !!scoringPlayer && scoringPlayer.team !== team;
    const publicPlayer = (id: number) => ({ id, name: players.get(id)?.name ?? `Player#${id} [LEFT]` });
    const assistingPlayer = assistant === undefined ? undefined : players.get(assistant);
    return {
        scorer: scorer === undefined ? null : publicPlayer(scorer),
        // Match existing assist rules: a different teammate, or the existing departed-player fallback.
        assistant: scoringPlayer && !ownGoal && assistant !== undefined && assistant !== scorer &&
            (!assistingPlayer || assistingPlayer.team === team) ? publicPlayer(assistant) : null,
        ownGoal,
    };
}
