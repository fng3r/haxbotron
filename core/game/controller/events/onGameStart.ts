import {PlayerObject} from "../../model/GameObject/PlayerObject";
import {TeamID} from "../../model/GameObject/TeamID";
import { ServiceContainer } from "../../services/ServiceContainer";

const DEFAULT_KICKRATE = {
    min: 6,
    rate: 12,
    burst: 4
}

export function onGameStartListener(byPlayer: PlayerObject | null): void {
    /* Event called when a game starts.
        byPlayer is the player which caused the event (can be null if the event wasn't caused by a player). */
    const services = ServiceContainer.getInstance();
    const room = services.room.getRoom();
    
    let placeholderStart = {
        playerID: 0,
        playerName: ''
    };

    services.match.setPlaying(true);

    let msg = `The game has been started.`;
    if (byPlayer !== null && byPlayer.id !== 0) {
        placeholderStart.playerID = byPlayer.id;
        placeholderStart.playerName = byPlayer.name;
        msg += `(by ${byPlayer.name}#${byPlayer.id})`;
    }

    room.setKickRateLimit(DEFAULT_KICKRATE.min, DEFAULT_KICKRATE.rate, DEFAULT_KICKRATE.burst);

    const startingLineup = {
        red: room.getPlayerList().filter(p => p.team === TeamID.Red),
        blue: room.getPlayerList().filter(p => p.team === TeamID.Blue)
    };
    services.match.startMatch(startingLineup);

    // replay record start
    room.startRecording();

    services.logger.i('onGameStart', msg);
}
