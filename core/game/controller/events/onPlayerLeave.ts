import * as Tst from "../Translator";
import * as LangRes from "../../resource/strings";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { updateAdmins } from "../RoomTools";
import { getUnixTimestamp } from "../DateTimeUtils";
import { convertTeamID2Name, TeamID } from "../../model/GameObject/TeamID";
import { convertToPlayerStorage, getBanlistDataFromDB, setBanlistDataToDB, setPlayerDataToDB } from "../Storage";

export async function onPlayerLeaveListener(player: PlayerObject): Promise<void> {
    // Event called when a player leaves the room.
    let leftTimeStamp: number = getUnixTimestamp();

    if (!window.gameRoom.playerList.has(player.id)) { // if the player wasn't registered in playerList
        return; // exit this event
    }

    const existingPlayer = window.gameRoom.playerList.get(player.id)!;

    let placeholderLeft = {
        playerID: player.id,
        playerName: player.name,
        playerAuth: existingPlayer.auth,
        possTeamRed: window.gameRoom.ballStack.possCalculate(TeamID.Red),
        possTeamBlue: window.gameRoom.ballStack.possCalculate(TeamID.Blue)
    };

    window.gameRoom.logger.i('onPlayerLeave', `${player.name}#${player.id} has left.`);
    window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.onLeft.playerLeft, placeholderLeft), null, 0xFFFFFF, "small", 0);

    window.gameRoom.playerList.get(player.id)!.entrytime.leftDate = leftTimeStamp; // save left time
    await setPlayerDataToDB(convertToPlayerStorage(window.gameRoom.playerList.get(player.id)!)); // save
    window.gameRoom.playerList.delete(player.id); // delete from player list
    window.gameRoom.playerRoles.delete(player.id); // delete from roles list

    if(window.gameRoom.config.rules.autoAdmin) { // if auto admin option is enabled
        updateAdmins(); // update admin
    }

    const playersCount = window.gameRoom._room.getPlayerList().length;
    // reset password to default one when more than one slot available
    if (playersCount < window.gameRoom.config._config.maxPlayers! - 1) {
        window.gameRoom._room.setPassword(window.gameRoom.config._config.password || null);
    }

    // emit websocket event
    window._emitSIOPlayerInOutEvent(player.id);
}
