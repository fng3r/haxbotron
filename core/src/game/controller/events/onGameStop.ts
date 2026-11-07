import type { PlayerObject } from "haxball.js";
import { RoomRuntime } from "../../runtime/RoomRuntime.js";
import { recordLiveMatchEvent } from "../../runtime/LiveBroadcast.js";


export function onGameStopListener(runtime: RoomRuntime, byPlayer: PlayerObject | null): void {
    /*
    Event called when a game stops.
    byPlayer is the player which caused the event (can be null if the event wasn't caused by a player).
    Haxball developer Basro said, The game will be stopped automatically after a team victory. (victory -> stop)
    */
    const stats = runtime.match.getMatchStats();
    recordLiveMatchEvent(runtime, { type: "stop", scores: stats.scores,
        ...(byPlayer ? { actor: byPlayer } : {}) });
    runtime.logger.i('onGameStop', JSON.stringify(stats));

    runtime.match.stopMatch();

    let msg = "The game has been stopped.";
    if (byPlayer !== null && byPlayer.id != 0) {
        msg += `(by ${byPlayer.name}#${byPlayer.id})`;
    }
    runtime.logger.i('onGameStop', msg);

    const replay = runtime.room.stopMatchRecording();
    runtime.room.refreshStadiumGeometry();
    runtime.social.sendReplayWebhook(runtime.config.getRUID(), stats, replay);
}
