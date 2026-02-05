import * as Tst from "../Translator";
import * as LangRes from "../../resource/strings";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { TeamID } from "../../model/GameObject/TeamID";
import { setDefaultRoomLimitation, setDefaultStadiums } from "../RoomTools";
import moment from "moment";
import { ServiceContainer } from "../../services/ServiceContainer";


export function onGameStopListener(byPlayer: PlayerObject): void {
    /*
    Event called when a game stops.
    byPlayer is the player which caused the event (can be null if the event wasn't caused by a player).
    Haxball developer Basro said, The game will be stopped automatically after a team victory. (victory -> stop)
    */
    const services = ServiceContainer.getInstance();
    const room = services.room.getRoom();
    const ballStack = services.match.getBallStack();
    
    var placeholderStop = {
        playerID: 0,
        playerName: '',
        possTeamRed: ballStack.possCalculate(TeamID.Red),
        possTeamBlue: ballStack.possCalculate(TeamID.Blue)
    };
    if(byPlayer !== null) {
        placeholderStop.playerID = byPlayer.id;
        placeholderStop.playerName = byPlayer.name;
    }

    const stats = services.match.getMatchStats();
    services.logger.i('onGameStop', JSON.stringify(stats));

    services.match.stopMatch();

    let msg = "The game has been stopped.";
    if (byPlayer !== null && byPlayer.id != 0) {
        msg += `(by ${byPlayer.name}#${byPlayer.id})`;
    }
    services.logger.i('onGameStop', msg);
    
    // setDefaultStadiums(); // check number of players and auto-set stadium
    // setDefaultRoomLimitation(); // score, time, teamlock set

    ballStack.initTouchInfo(); // clear touch info
    ballStack.clear(); // clear the stack.
    ballStack.possClear(); // clear possession count

    // stop replay record and send it
    const replay = room.stopRecording();
    
    const webhook = services.social.getDiscordWebhook();
    if(replay && webhook.feed && webhook.replayUpload && webhook.replaysWebhookId && webhook.replaysWebhookToken) {
        const roomId = services.config.getRUID();

        window._feedSocialDiscordWebhook(webhook.replaysWebhookId, webhook.replaysWebhookToken, "replay", {
            roomId: roomId
            ,matchStats: stats
            ,data: JSON.stringify(Array.from(replay))
        });
    }
}
