import type { PlayerObject } from "haxball.js";
import { TeamID } from "../../model/GameObject/TeamID.js";
import * as LangRes from "../../resource/strings.js";
import { RoomRuntime } from "../../runtime/RoomRuntime.js";
import * as Tst from "../../shared/Translator.js";

export function cmdSwitch(runtime: RoomRuntime, byPlayer: PlayerObject): void {
    const room = runtime.room.getRoom();
    const playerList = room.getPlayerList();
    
    const placeholder = {
        playerID: byPlayer.id
        ,playerName: byPlayer.name
    };

    if(!byPlayer.admin) {
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
