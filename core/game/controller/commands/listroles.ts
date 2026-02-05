import {PlayerObject} from "../../model/GameObject/PlayerObject";
import * as LangRes from "../../resource/strings";
import * as Tst from "../Translator";
import { ServiceContainer } from "../../services/ServiceContainer";

export function cmdListRoles(byPlayer: PlayerObject): void {
    const services = ServiceContainer.getInstance();
    
    const [...playerRoles] = services.playerRole.getRoles().values();
    const allRoles = [];
    for (const playerRole of playerRoles) {
        allRoles.push(Tst.maketext(LangRes.command.listroles.singleRole, {
            playerName: playerRole.name,
            playerRole: playerRole.role
        }));
    }

    services.room.sendAnnouncement(Tst.maketext(LangRes.command.listroles.rolesList, {rolesList: allRoles.join(', ')}), null, 0x479947, "normal", 1);
}