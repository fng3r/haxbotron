import {PlayerObject} from "../../model/GameObject/PlayerObject";
import {PlayerRoles} from "../../model/PlayerRole/PlayerRoles";
import * as LangRes from "../../resource/strings";
import * as Tst from "../Translator";
import { ServiceContainer } from "../../services/ServiceContainer";

export function cmdSetPassword(byPlayer: PlayerObject, password?: string): void {
    const services = ServiceContainer.getInstance();
    
    const playerRole = services.playerRole.getRole(byPlayer.id)!;
    if (!PlayerRoles.atLeast(playerRole, PlayerRoles.S_ADM)) {
        services.room.sendAnnouncement(LangRes.command.setpassword._ErrorNoPermission, byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    const placeholder = {
        playerID: byPlayer.id,
        playerName: byPlayer.name
    };

    if (!password) {
        services.room.setPassword(null);
        services.config.setRoomPassword();
        services.room.sendAnnouncement(Tst.maketext(LangRes.command.setpassword.onPasswordReset, placeholder), null, 0x479947, "normal", 1);
    }
    else {
        services.room.setPassword(password);
        services.config.setRoomPassword(password);
        services.room.sendAnnouncement(Tst.maketext(LangRes.command.setpassword.onPasswordSet, placeholder), null, 0x479947, "normal", 1);
    }
}