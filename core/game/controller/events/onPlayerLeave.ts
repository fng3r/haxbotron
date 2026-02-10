import * as Tst from "../Translator";
import * as LangRes from "../../resource/strings";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { updateAdmins } from "../RoomTools";
import { getUnixTimestamp } from "../DateTimeUtils";
import { convertTeamID2Name, TeamID } from "../../model/GameObject/TeamID";
import { getInjectedDBRepository } from "../../repositories/InjectedDBRepository";
import { ServiceContainer } from "../../services/ServiceContainer";

export async function onPlayerLeaveListener(player: PlayerObject): Promise<void> {
    // Event called when a player leaves the room.
    const services = ServiceContainer.getInstance();
    const repository = getInjectedDBRepository();
    const room = services.room.getRoom();
    const playerList = services.player.getPlayerList();
    const config = services.config.getConfig();
    const ballStack = services.match.getBallStack();
    
    let leftTimeStamp: number = getUnixTimestamp();

    if (!playerList.has(player.id)) { // if the player wasn't registered in playerList
        return; // exit this event
    }

    const existingPlayer = playerList.get(player.id)!;

    let placeholderLeft = {
        playerID: player.id,
        playerName: player.name,
        playerAuth: existingPlayer.auth,
        possTeamRed: ballStack.possCalculate(TeamID.Red),
        possTeamBlue: ballStack.possCalculate(TeamID.Blue)
    };

    services.logger.i('onPlayerLeave', `${player.name}#${player.id} has left.`);
    services.room.sendAnnouncement(Tst.maketext(LangRes.onLeft.playerLeft, placeholderLeft), null, 0xFFFFFF, "small", 0);

    playerList.get(player.id)!.entrytime.leftDate = leftTimeStamp; // save left time
    await repository.upsertPlayer(repository.toPlayerStorage(playerList.get(player.id)!)); // save
    services.player.removePlayer(player.id); // delete from player list
    services.playerRole.removeRole(player.id); // delete from roles list

    if(config.rules.autoAdmin) { // if auto admin option is enabled
        updateAdmins(); // update admin
    }

    const playersCount = room.getPlayerList().length;
    // reset password to default one when more than one slot become available
    if (playersCount === config._config.maxPlayers! - 2) {
        room.setPassword(config._config.password || null);
    }

    // emit websocket event
    window._emitSIOPlayerInOutEvent(player.id);
}
