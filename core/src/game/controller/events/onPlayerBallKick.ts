import type { PlayerObject } from "haxball.js";
import { RoomRuntime } from "../../runtime/RoomRuntime.js";
import { getKickIndicator } from "../../runtime/KickIndicator.js";
import { publishLiveKick } from "../../runtime/LiveBroadcast.js";

export function onPlayerBallKickListener(runtime: RoomRuntime, player: PlayerObject): void {
    const indicator = getKickIndicator(runtime);
    indicator.input(player.id, (player.input & runtime.room.getRoom().InputFlags.kick) !== 0);
    indicator.kicked(player.id);
    publishLiveKick(runtime, player.id);
    // Event called when a player kicks the ball.
    // records player's id, team when the ball was kicked
    const playerList = runtime.players.getPlayerList();
    runtime.match.recordBallKick(player, playerList);
}
