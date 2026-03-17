import * as LangRes from "../../resource/strings";
import { RoomRuntime } from "../../runtime/RoomRuntime";
import * as Tst from "../Translator";

export function cmdListRoles(runtime: RoomRuntime, byPlayer: PlayerObject): void {
    const [...playerRoles] = runtime.playerRoles.getRoles().values();
    const rolesString = playerRoles.map(playerRole => `${playerRole.name} (${playerRole.role})`).join(', ');

    runtime.room.sendAnnouncement(Tst.maketext(LangRes.command.listroles.rolesList, {rolesList: rolesString}), null, 0x479947, "normal", 1);
}
