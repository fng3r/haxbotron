import type { PlayerObject } from "haxball.js";
import * as Messages from "../../resource/strings.js";
import { RoomRuntime } from "../../runtime/RoomRuntime.js";
import * as Tst from "../../shared/Translator.js";

export function cmdListRoles(runtime: RoomRuntime, byPlayer: PlayerObject): void {
    const [...playerRoles] = runtime.playerRoles.getRoles().values();
    const rolesString = playerRoles.map(playerRole => `${playerRole.name} (${playerRole.role})`).join(', ');

    runtime.room.sendAnnouncement(Tst.maketext(Messages.command.listroles.rolesList, {rolesList: rolesString}), null, 0x479947, "normal", 1);
}
