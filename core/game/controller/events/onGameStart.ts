import {PlayerObject} from "../../model/GameObject/PlayerObject";
import {TeamID} from "../../model/GameObject/TeamID";

const DEFAULT_KICKRATE = {
    min: 6,
    rate: 12,
    burst: 4
}

export function onGameStartListener(byPlayer: PlayerObject | null): void {
    /* Event called when a game starts.
        byPlayer is the player which caused the event (can be null if the event wasn't caused by a player). */
    let placeholderStart = {
        playerID: 0,
        playerName: ''
    };

    window.gameRoom.isGamingNow = true; // turn on

    let msg = `The game has been started.`;
    if (byPlayer !== null && byPlayer.id !== 0) {
        placeholderStart.playerID = byPlayer.id;
        placeholderStart.playerName = byPlayer.name;
        msg += `(by ${byPlayer.name}#${byPlayer.id})`;
    }

    window.gameRoom._room.setKickRateLimit(DEFAULT_KICKRATE.min, DEFAULT_KICKRATE.rate, DEFAULT_KICKRATE.burst);

    window.gameRoom.matchStats.startedAt = Date.now()
    window.gameRoom.matchStats.scores = {
        red: 0,
        blue: 0,
        time: 0
    };
    window.gameRoom.matchStats.startingLineup = {
        red: window.gameRoom._room.getPlayerList().filter(p => p.team === TeamID.Red),
        blue: window.gameRoom._room.getPlayerList().filter(p => p.team === TeamID.Blue)
    }

    // replay record start
    window.gameRoom._room.startRecording();

    window.gameRoom.logger.i('onGameStart', msg);
}
