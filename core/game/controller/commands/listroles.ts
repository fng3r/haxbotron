import {PlayerObject} from "../../model/GameObject/PlayerObject";
import * as LangRes from "../../resource/strings";
import * as Tst from "../Translator";

export function cmdListRoles(byPlayer: PlayerObject): void {
    const [...playerRoles] = window.gameRoom.playerRoles.values();
    const allRoles = [];
    for (const playerRole of playerRoles) {
        allRoles.push(Tst.maketext(LangRes.command.listroles.singleRole, {
            playerName: playerRole.name,
            playerRole: playerRole.role
        }));
    }

    window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.listroles.rolesList, {rolesList: allRoles.join(', ')}), null, 0x479947, "normal", 1);
}