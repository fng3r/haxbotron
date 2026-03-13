import * as Tst from "../Translator";
import * as LangRes from "../../resource/strings";
import { convertTeamID2Name, TeamID } from "../../model/GameObject/TeamID";
import { RoomRuntime } from "../../runtime/RoomRuntime";
import { emitPlayerStatusChange } from "../../runtime/WorkerEventBridge";

export function onPlayerTeamChangeListener(runtime: RoomRuntime, changedPlayer: PlayerObject, byPlayer: PlayerObject | null): void {
    // Event called when a player team is changed.
    // byPlayer is the player which caused the event (can be null if the event wasn't caused by a player).
    const room = runtime.room.getRoom();
    const playerList = runtime.player.getPlayerList();
    
    let placeholderTeamChange = {
        targetPlayerID: changedPlayer.id,
        targetPlayerName: changedPlayer.name,
        targetAfkReason: ''
    }

    if (changedPlayer.id === 0) { // if the player changed into other team is host player(always id 0),
        room.setPlayerTeam(0, TeamID.Spec); // stay host player in Spectators team.
        runtime.logger.i('onPlayerTeamChange', `Bot host is moved team but it is rejected.`);
    } else {
        playerList.get(changedPlayer.id)!.team = changedPlayer.team;
        runtime.logger.i('onPlayerTeamChange', `${changedPlayer.name}#${changedPlayer.id} is moved team to ${convertTeamID2Name(changedPlayer.team)}.`);
    }

    emitPlayerStatusChange(changedPlayer.id);
}
