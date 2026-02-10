import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { ServiceContainer } from "../../services/ServiceContainer";


export function onGameStopListener(byPlayer: PlayerObject): void {
    /*
    Event called when a game stops.
    byPlayer is the player which caused the event (can be null if the event wasn't caused by a player).
    Haxball developer Basro said, The game will be stopped automatically after a team victory. (victory -> stop)
    */
    const services = ServiceContainer.getInstance();
    const room = services.room.getRoom();

    const stats = services.match.getMatchStats();
    services.logger.i('onGameStop', JSON.stringify(stats));

    services.match.stopMatch();

    let msg = "The game has been stopped.";
    if (byPlayer !== null && byPlayer.id != 0) {
        msg += `(by ${byPlayer.name}#${byPlayer.id})`;
    }
    services.logger.i('onGameStop', msg);

    // stop replay record and send it
    const replay = room.stopRecording();
    services.social.emitReplayWebhook(services.config.getRUID(), stats, replay);
}
