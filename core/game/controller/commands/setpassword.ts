import {PlayerRoles} from "../../model/PlayerRole/PlayerRoles";
import * as LangRes from "../../resource/strings";
import * as Tst from "../Translator";
import { RoomRuntime } from "../../runtime/RoomRuntime";

export function cmdSetPassword(runtime: RoomRuntime, byPlayer: PlayerObject, password?: string): void {
    const playerRole = runtime.playerRole.getRole(byPlayer.id)!;
    if (!PlayerRoles.atLeast(playerRole, PlayerRoles.S_ADM)) {
        runtime.room.sendAnnouncement(LangRes.command.setpassword._ErrorNoPermission, byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    const placeholder = {
        playerID: byPlayer.id,
        playerName: byPlayer.name
    };

    if (!password) {
        runtime.room.setPassword(null);
        runtime.config.setRoomPassword();
        runtime.room.sendAnnouncement(Tst.maketext(LangRes.command.setpassword.onPasswordReset, placeholder), null, 0x479947, "normal", 1);
    }
    else {
        runtime.room.setPassword(password);
        runtime.config.setRoomPassword(password);
        runtime.room.sendAnnouncement(Tst.maketext(LangRes.command.setpassword.onPasswordSet, placeholder), null, 0x479947, "normal", 1);
    }
}
