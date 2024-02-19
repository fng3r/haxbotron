import {PlayerObject} from "../../model/GameObject/PlayerObject";
import {PlayerRoles} from "../../model/PlayerRole/PlayerRoles";
import * as LangRes from "../../resource/strings";
import * as Tst from "../Translator";

export function cmdSetPassword(byPlayer: PlayerObject, password?: string): void {
    const playerRole = window.gameRoom.playerRoles.get(byPlayer.id);
    if (!PlayerRoles.atLeast(playerRole, PlayerRoles.S_ADM)) {
        window.gameRoom._room.sendAnnouncement(LangRes.command.setpassword._ErrorNoPermission, byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    const placeholder = {
        playerID: byPlayer.id,
        playerName: byPlayer.name
    };

    if (!password) {
        window.gameRoom._room.setPassword(null);
        window.gameRoom.config._config.password = null!;
        window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.setpassword.onPasswordReset, placeholder), null, 0x479947, "normal", 1);
    }
    else {
        window.gameRoom._room.setPassword(password);
        window.gameRoom.config._config.password = password;
        window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.setpassword.onPasswordSet, placeholder), null, 0x479947, "normal", 1);
    }
}