import { RoomRuntime } from "../../runtime/RoomRuntime";

export function onPlayerBallKickListener(runtime: RoomRuntime, player: PlayerObject): void {
    // Event called when a player kicks the ball.
    // records player's id, team when the ball was kicked
    const playerList = runtime.player.getPlayerList();
    runtime.match.recordBallKick(player, playerList);
}
