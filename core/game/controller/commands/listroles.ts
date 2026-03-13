import { PlayerObject } from "../../model/GameObject/PlayerObject";
import * as LangRes from "../../resource/strings";
import { ServiceContainer } from "../../services/ServiceContainer";
import * as Tst from "../Translator";

export function cmdListRoles(byPlayer: PlayerObject): void {
    const services = ServiceContainer.getInstance();
    
    const [...playerRoles] = services.playerRole.getRoles().values();
    const rolesString = playerRoles.map(playerRole => `${playerRole.name} (${playerRole.role})`).join(', ');

    services.room.sendAnnouncement(Tst.maketext(LangRes.command.listroles.rolesList, {rolesList: rolesString}), null, 0x479947, "normal", 1);
}