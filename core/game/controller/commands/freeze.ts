import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { PlayerRoles } from "../../model/PlayerRole/PlayerRoles";
import * as LangRes from "../../resource/strings";
import { ServiceContainer } from "../../services/ServiceContainer";

export function cmdFreeze(byPlayer: PlayerObject): void {
    const services = ServiceContainer.getInstance();
    
    const playerRole = services.playerRole.getRole(byPlayer.id)!;
    if(PlayerRoles.atLeast(playerRole, PlayerRoles.S_ADM)) {
        const isFrozen = services.chat.toggleFreeze();
        if (isFrozen) {
            services.room.sendAnnouncement(LangRes.command.freeze.onFreeze, null, 0x479947, "normal", 1);
        } else {
            services.room.sendAnnouncement(LangRes.command.freeze.offFreeze, null, 0x479947, "normal", 1);
        }

        window._emitSIOPlayerStatusChangeEvent(byPlayer.id);
    } else {
        services.room.sendAnnouncement(LangRes.command.freeze._ErrorNoPermission, byPlayer.id, 0xFF7777, "normal", 2);
    }
}
