import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { getInjectedDBRepository } from "../../repositories/InjectedDBRepository";
import * as LangRes from "../../resource/strings";
import { ServiceContainer } from "../../services/ServiceContainer";
import { getUnixTimestamp } from "../DateTimeUtils";
import { updateAdmins } from "../RoomTools";
import * as Tst from "../Translator";

export async function onPlayerLeaveListener(player: PlayerObject): Promise<void> {
    // Event called when a player leaves the room.
    const services = ServiceContainer.getInstance();
    const repository = getInjectedDBRepository();
    const room = services.room.getRoom();
    const playerList = services.player.getPlayerList();
    const config = services.config.getConfig();
    
    let leftTimeStamp: number = getUnixTimestamp();

    if (!playerList.has(player.id)) { // if the player wasn't registered in playerList
        return;
    }

    const existingPlayer = playerList.get(player.id)!;

    let placeholderLeft = {
        playerID: player.id,
        playerName: player.name,
        playerAuth: existingPlayer.auth,
    };

    services.logger.i('onPlayerLeave', `${player.name}#${player.id} has left.`);
    services.room.sendAnnouncement(Tst.maketext(LangRes.onLeft.playerLeft, placeholderLeft), null, 0xFFFFFF, "small", 0);

    playerList.get(player.id)!.entrytime.leftDate = leftTimeStamp;
    await repository.upsertPlayer(repository.toPlayerStorage(playerList.get(player.id)!));
    services.player.removePlayer(player.id);
    services.playerRole.removeRole(player.id);

    if(config.rules.autoAdmin) {
        updateAdmins();
    }

    const playersCount = room.getPlayerList().length;
    // reset password to default one when more than one slot become available
    if (playersCount === config._config.maxPlayers! - 2) {
        room.setPassword(config._config.password || null);
    }

    // emit websocket event
    window._emitSIOPlayerInOutEvent(player.id);
}
