import * as Tst from "../Translator";
import * as LangRes from "../../resource/strings";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { convertTeamID2Name, TeamID } from "../../model/GameObject/TeamID";
import { ServiceContainer } from "../../services/ServiceContainer";

export function onPlayerTeamChangeListener(changedPlayer: PlayerObject, byPlayer: PlayerObject): void {
    // Event called when a player team is changed.
    // byPlayer is the player which caused the event (can be null if the event wasn't caused by a player).
    const services = ServiceContainer.getInstance();
    const room = services.room.getRoom();
    const playerList = services.player.getPlayerList();
    
    let placeholderTeamChange = {
        targetPlayerID: changedPlayer.id,
        targetPlayerName: changedPlayer.name,
        targetAfkReason: ''
    }

    if (changedPlayer.id === 0) { // if the player changed into other team is host player(always id 0),
        room.setPlayerTeam(0, TeamID.Spec); // stay host player in Spectators team.
        services.logger.i('onPlayerTeamChange', `Bot host is moved team but it is rejected.`);
    } else {
        playerList.get(changedPlayer.id)!.team = changedPlayer.team;
        services.logger.i('onPlayerTeamChange', `${changedPlayer.name}#${changedPlayer.id} is moved team to ${convertTeamID2Name(changedPlayer.team)}.`);
    }

    window._emitSIOPlayerStatusChangeEvent(changedPlayer.id);
}
