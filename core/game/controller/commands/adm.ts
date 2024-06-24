import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { PlayerRoles } from "../../model/PlayerRole/PlayerRoles";
import * as LangRes from "../../resource/strings";

export function cmdAdm(byPlayer: PlayerObject): void {
    const playerRole = window.gameRoom.playerRoles.get(byPlayer.id)!;
    if(PlayerRoles.atLeast(playerRole, PlayerRoles.ADM)) {
        window.gameRoom._room.setPlayerAdmin(byPlayer.id, true);

        window._emitSIOPlayerStatusChangeEvent(byPlayer.id);
    } else {
        window.gameRoom._room.sendAnnouncement(LangRes.command.adm._ErrorNoPermission, byPlayer.id, 0xFF7777, "normal", 2);
    }
}
