import {PlayerObject} from "../../model/GameObject/PlayerObject";
import {PlayerRoles} from "../../model/PlayerRole/PlayerRoles";
import {TeamID} from "../../model/GameObject/TeamID";
import * as Tst from "../Translator";
import * as LangRes from "../../resource/strings";
import { ServiceContainer } from "../../services/ServiceContainer";

export function cmdSwitch(byPlayer: PlayerObject): void {
    const services = ServiceContainer.getInstance();
    const room = services.room.getRoom();
    const playerList = services.player.getPlayerList();
    
    const placeholder = {
        playerID: byPlayer.id
        ,playerName: byPlayer.name
    };

    const playerRole = services.playerRole.getRole(byPlayer.id)!;
    if(!PlayerRoles.atLeast(playerRole, PlayerRoles.S_ADM)) {
        services.room.sendAnnouncement(LangRes.command.switch._ErrorNoPermission, byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }
    if (services.match.isPlaying()) {
        services.room.sendAnnouncement(LangRes.command.switch._ErrorGameStartedAlready, byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    for (const player of playerList.values()) {
        if (player.team === TeamID.Red) {
            room.setPlayerTeam(player.id, TeamID.Blue);
        } else if (player.team === TeamID.Blue) {
            room.setPlayerTeam(player.id, TeamID.Red);
        }
    }

    services.logger.i('cmdSwitch', `Teams were switched by ${byPlayer.name}#${byPlayer.id}`);
    services.room.sendAnnouncement(Tst.maketext(LangRes.command.switch.success, placeholder), byPlayer.id, 0x479947, "normal", 1);
}