import type { PlayerObject } from "haxball.js";
import { PlayerRoles } from "../../model/PlayerRole/PlayerRoles.js";
import * as LangRes from "../../resource/strings.js";
import { emitPlayerStatusChange } from "../../runtime/WorkerEventBridge.js";
import { RoomRuntime } from "../../runtime/RoomRuntime.js";

export function cmdFreeze(runtime: RoomRuntime, byPlayer: PlayerObject): void {
    const playerRole = runtime.playerRoles.getRole(byPlayer.id)!;
    if(PlayerRoles.atLeast(playerRole, PlayerRoles.S_ADM)) {
        const isFrozen = runtime.chat.toggleFreeze();
        if (isFrozen) {
            runtime.room.sendAnnouncement(LangRes.command.freeze.onFreeze, null, 0x479947, "normal", 1);
        } else {
            runtime.room.sendAnnouncement(LangRes.command.freeze.offFreeze, null, 0x479947, "normal", 1);
        }

        emitPlayerStatusChange(byPlayer.id);
    } else {
        runtime.room.sendAnnouncement(LangRes.command.freeze._ErrorNoPermission, byPlayer.id, 0xFF7777, "normal", 2);
    }
}
