import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { PlayerRoles } from "../../model/PlayerRole/PlayerRoles";
import * as LangRes from "../../resource/strings";
import { ServiceContainer } from "../../services/ServiceContainer";

export function cmdAdm(byPlayer: PlayerObject): void {
    const services = ServiceContainer.getInstance();
    const room = services.room.getRoom();
    
    const playerRole = services.playerRole.getRole(byPlayer.id)!;
    if(PlayerRoles.atLeast(playerRole, PlayerRoles.ADM)) {
        room.setPlayerAdmin(byPlayer.id, true);

        window._emitSIOPlayerStatusChangeEvent(byPlayer.id);
    } else {
        services.room.sendAnnouncement(LangRes.command.adm._ErrorNoPermission, byPlayer.id, 0xFF7777, "normal", 2);
    }
}
