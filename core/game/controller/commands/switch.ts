import {PlayerObject} from "../../model/GameObject/PlayerObject";
import {PlayerRoles} from "../../model/PlayerRole/PlayerRoles";
import {TeamID} from "../../model/GameObject/TeamID";
import * as Tst from "../Translator";
import * as LangRes from "../../resource/strings";

export function cmdSwitch(byPlayer: PlayerObject): void {
    const placeholder = {
        playerID: byPlayer.id
        ,playerName: byPlayer.name
    };

    const playerRole = window.gameRoom.playerRoles.get(byPlayer.id)!;
    if(!PlayerRoles.atLeast(playerRole, PlayerRoles.S_ADM)) {
        window.gameRoom._room.sendAnnouncement(LangRes.command.switch._ErrorNoPermission, byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }
    if (window.gameRoom.isGamingNow) {
        window.gameRoom._room.sendAnnouncement(LangRes.command.switch._ErrorGameStartedAlready, byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    for (const player of window.gameRoom.playerList.values()) {
        if (player.team === TeamID.Red) {
            window.gameRoom._room.setPlayerTeam(player.id, TeamID.Blue);
        } else if (player.team === TeamID.Blue) {
            window.gameRoom._room.setPlayerTeam(player.id, TeamID.Red);
        }
    }

    window.gameRoom.logger.i('cmdSwitch', `Teams were switched by ${byPlayer.name}#${byPlayer.id}`);
    window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.switch.success, placeholder), byPlayer.id, 0x479947, "normal", 1);
}