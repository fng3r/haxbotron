import { PlayerRoles } from "../../model/PlayerRole/PlayerRoles";
import * as LangRes from "../../resource/strings";
import { emitPlayerStatusChange } from "../../runtime/WorkerEventBridge";
import { RoomRuntime } from "../../runtime/RoomRuntime";

export function cmdAdm(runtime: RoomRuntime, byPlayer: PlayerObject): void {
    const room = runtime.room.getRoom();
    
    const playerRole = runtime.playerRole.getRole(byPlayer.id)!;
    if(PlayerRoles.atLeast(playerRole, PlayerRoles.ADM)) {
        room.setPlayerAdmin(byPlayer.id, true);

        emitPlayerStatusChange(byPlayer.id);
    } else {
        runtime.room.sendAnnouncement(LangRes.command.adm._ErrorNoPermission, byPlayer.id, 0xFF7777, "normal", 2);
    }
}
