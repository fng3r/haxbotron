import { TeamID } from "../../model/GameObject/TeamID";
import { RoomRuntime } from "../../runtime/RoomRuntime";

const DEFAULT_KICKRATE = {
    min: 6,
    rate: 12,
    burst: 4
}

export function onGameStartListener(runtime: RoomRuntime, byPlayer: PlayerObject | null): void {
    /* Event called when a game starts.
        byPlayer is the player which caused the event (can be null if the event wasn't caused by a player). */
    const room = runtime.room.getRoom();

    room.startRecording();
    room.setKickRateLimit(DEFAULT_KICKRATE.min, DEFAULT_KICKRATE.rate, DEFAULT_KICKRATE.burst);

    const startingLineup = {
        red: room.getPlayerList().filter(p => p.team === TeamID.Red),
        blue: room.getPlayerList().filter(p => p.team === TeamID.Blue)
    };
    runtime.match.startMatch(startingLineup);

    let msg = `The game has been started.`;
    if (byPlayer !== null && byPlayer.id !== 0) {
        msg += `(by ${byPlayer.name}#${byPlayer.id})`;
    }
    runtime.logger.i('onGameStart', msg);
}
