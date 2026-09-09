import type { PlayerObject } from "haxball.js";
import { PlayerRoles } from "../../model/PlayerRole/PlayerRoles.js";
import * as Messages from "../../resource/strings.js";
import { emitPlayerStatusChange } from "../../runtime/WorkerEventBridge.js";
import { RoomRuntime } from "../../runtime/RoomRuntime.js";

export function cmdAdm(runtime: RoomRuntime, byPlayer: PlayerObject): void {
    const room = runtime.room.getRoom();
    
    const playerRole = runtime.playerRoles.getRole(byPlayer.id)!;
    if(PlayerRoles.atLeast(playerRole, PlayerRoles.ADM)) {
        room.setPlayerAdmin(byPlayer.id, true);

        emitPlayerStatusChange(byPlayer.id);
    } else {
        runtime.room.sendAnnouncement(Messages.command._ErrorNoPermission, byPlayer.id, 0xFF7777, "normal", 2);
    }
}
