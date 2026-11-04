import { scheduleLiveFrame } from "../../runtime/LiveBroadcast.js";
import { getKickIndicator } from "../../runtime/KickIndicator.js";
import { RoomRuntime } from "../../runtime/RoomRuntime.js";

export function onGameTickListener(runtime: RoomRuntime): void {
    const room = runtime.room.getRoom();
    
    const scores = room.getScores();
    if (scores) runtime.match.updateScores(scores.red, scores.blue, scores.time);
    const players = room.getPlayerList();
    const indicator = getKickIndicator(runtime);
    for (const player of players) indicator.input(player.id, (player.input & room.InputFlags.kick) !== 0);
    indicator.advance(players.filter(p => p.team !== 0).map(p => p.id));
    scheduleLiveFrame(runtime);
}
