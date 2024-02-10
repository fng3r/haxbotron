import { PlayerObject } from "../../model/GameObject/PlayerObject";
import * as LangRes from "../../resource/strings";
import {PlayerRoles} from "../../model/PlayerRole/PlayerRoles";

const PRIVILEGED_ROLES = [PlayerRoles.S_ADM, PlayerRoles.CO_HOST];

export function cmdFreeze(byPlayer: PlayerObject): void {
    const playerRole = window.gameRoom.playerRoles.get(byPlayer.id);
    if(PRIVILEGED_ROLES.some(role => role === playerRole.role)) {
        if(window.gameRoom.isMuteAll) {
            window.gameRoom.isMuteAll = false; //off
            window.gameRoom._room.sendAnnouncement(LangRes.command.freeze.offFreeze, null, 0x479947, "normal", 1);
        } else {
            window.gameRoom.isMuteAll = true; //on
            window.gameRoom._room.sendAnnouncement(LangRes.command.freeze.onFreeze, null, 0x479947, "normal", 1);
        }

        window._emitSIOPlayerStatusChangeEvent(byPlayer.id);
    } else {
        window.gameRoom._room.sendAnnouncement(LangRes.command.freeze._ErrorNoPermission, byPlayer.id, 0xFF7777, "normal", 2);
    }
}
