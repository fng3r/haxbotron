import * as LangRes from "../../resource/strings";
import { RoomRuntime } from "../../runtime/RoomRuntime";
import { emitPlayerJoinLeave } from "../../runtime/WorkerEventBridge";
import { getUnixTimestamp } from "../DateTimeUtils";
import { updateAdmins } from "../RoomTools";
import * as Tst from "../Translator";

export async function onPlayerLeaveListener(runtime: RoomRuntime, player: PlayerObject): Promise<void> {
    // Event called when a player leaves the room.
    const room = runtime.room.getRoom();
    const playerList = runtime.players.getPlayerList();
    
    let leftTimeStamp: number = getUnixTimestamp();

    const existingPlayer = playerList.get(player.id);
    if (!existingPlayer) {
        return;
    }

    let placeholderLeft = {
        playerID: player.id,
        playerName: player.name,
        playerAuth: existingPlayer.auth,
    };

    runtime.logger.i('onPlayerLeave', `${player.name}#${player.id} has left.`);
    runtime.room.sendAnnouncement(Tst.maketext(LangRes.onLeft.playerLeft, placeholderLeft), null, 0xFFFFFF, "small", 0);

    const playerEntry = playerList.get(player.id)!;
    playerEntry.entrytime.leftDate = leftTimeStamp;
    await runtime.playerOnboarding.persistPlayer(playerEntry);
    runtime.players.removePlayer(player.id);
    runtime.playerRoles.removeRole(player.id);

    if(runtime.config.getRules().autoAdmin) {
        updateAdmins(runtime);
    }

    const playersCount = room.getPlayerList().length;
    // reset password to default one when more than one slot become available
    if (playersCount === runtime.config.getMaxPlayers() - 2) {
        room.setPassword(runtime.config.getRoomPassword() || null);
    }

    // emit websocket event
    emitPlayerJoinLeave(player.id);
}
