import {PlayerRoles} from "../../model/PlayerRole/PlayerRoles";
import {TeamID} from "../../model/GameObject/TeamID";
import * as Tst from "../../shared/Translator";
import * as LangRes from "../../resource/strings";
import { RoomRuntime } from "../../runtime/RoomRuntime";

export function cmdSwitch(runtime: RoomRuntime, byPlayer: PlayerObject): void {
    const room = runtime.room.getRoom();
    const playerList = runtime.players.getPlayerList();
    
    const placeholder = {
        playerID: byPlayer.id
        ,playerName: byPlayer.name
    };

    const playerRole = runtime.playerRoles.getRole(byPlayer.id)!;
    if(!PlayerRoles.atLeast(playerRole, PlayerRoles.S_ADM)) {
        runtime.room.sendAnnouncement(LangRes.command.switch._ErrorNoPermission, byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }
    if (runtime.match.isPlaying()) {
        runtime.room.sendAnnouncement(LangRes.command.switch._ErrorGameStartedAlready, byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    for (const player of playerList.values()) {
        if (player.team === TeamID.Red) {
            room.setPlayerTeam(player.id, TeamID.Blue);
        } else if (player.team === TeamID.Blue) {
            room.setPlayerTeam(player.id, TeamID.Red);
        }
    }

    runtime.logger.i('cmdSwitch', `Teams were switched by ${byPlayer.name}#${byPlayer.id}`);
    runtime.room.sendAnnouncement(Tst.maketext(LangRes.command.switch.success, placeholder), byPlayer.id, 0x479947, "normal", 1);
}
