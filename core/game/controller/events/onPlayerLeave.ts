import * as LangRes from "../../resource/strings";
import { getRoomDbRepository } from "../../runtime/RoomDbRepository";
import { RoomRuntime } from "../../runtime/RoomRuntime";
import { emitPlayerJoinLeave } from "../../runtime/WorkerEventBridge";
import { getUnixTimestamp } from "../DateTimeUtils";
import { updateAdmins } from "../RoomTools";
import * as Tst from "../Translator";

export async function onPlayerLeaveListener(runtime: RoomRuntime, player: PlayerObject): Promise<void> {
    // Event called when a player leaves the room.
    const repository = getRoomDbRepository();
    const room = runtime.room.getRoom();
    const playerList = runtime.player.getPlayerList();
    const config = runtime.config.getConfig();
    
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

    runtime.logger.i('onPlayerLeave', `${player.name}#${player.id} has left.`);
    runtime.room.sendAnnouncement(Tst.maketext(LangRes.onLeft.playerLeft, placeholderLeft), null, 0xFFFFFF, "small", 0);

    playerList.get(player.id)!.entrytime.leftDate = leftTimeStamp;
    await repository.upsertPlayer(repository.toPlayerStorage(playerList.get(player.id)!));
    runtime.player.removePlayer(player.id);
    runtime.playerRole.removeRole(player.id);

    if(config.rules.autoAdmin) {
        updateAdmins(runtime);
    }

    const playersCount = room.getPlayerList().length;
    // reset password to default one when more than one slot become available
    if (playersCount === config._config.maxPlayers! - 2) {
        room.setPassword(config._config.password || null);
    }

    // emit websocket event
    emitPlayerJoinLeave(player.id);
}
