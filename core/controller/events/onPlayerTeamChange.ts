import * as Tst from "../Translator";
import * as LangRes from "../../resources/strings";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { TeamID } from "../../model/GameObject/TeamID";

export function onPlayerTeamChangeListener(changedPlayer: PlayerObject, byPlayer: PlayerObject): void {
    // Event called when a player team is changed.
        // byPlayer is the player which caused the event (can be null if the event wasn't caused by a player).
        let placeholderTeamChange = { 
            targetPlayerID: changedPlayer.id,
            targetPlayerName: changedPlayer.name,
            targetAfkReason: ''
        }
        if (changedPlayer.id === 0) { // if the player changed into other team is host player(always id 0),
            window.room.setPlayerTeam(0, TeamID.Spec); // stay host player in Spectators team.
        } else {
            if(byPlayer !== null && byPlayer.id !== 0) { // if changed by admin player
                if(window.playerList.get(changedPlayer.id)!.permissions.afkmode == true) { // if changed player is afk status
                    placeholderTeamChange.targetAfkReason = window.playerList.get(changedPlayer.id)!.permissions.afkreason;
                    window.room.setPlayerTeam(changedPlayer.id, TeamID.Spec); // stay the player in Spectators team.
                    window.room.sendAnnouncement(Tst.maketext(LangRes.onTeamChange.afkPlayer, placeholderTeamChange), null, 0xFF0000, "normal", 0);
                    return; // exit this event
                }
            }
            window.playerList.get(changedPlayer.id)!.team = changedPlayer.team;
        }
}
