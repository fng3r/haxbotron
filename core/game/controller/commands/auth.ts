import {PlayerObject} from "../../model/GameObject/PlayerObject";
import * as LangRes from "../../resource/strings";
import * as Tst from "../Translator";

export function cmdAuth(byPlayer: PlayerObject, playerId?: number): void {
    playerId = playerId || byPlayer.id;

    if (window.gameRoom.playerList.has(playerId)) {
        const player = window.gameRoom.playerList.get(playerId)!;
        let placeholder = {
            playerName: player.name
            ,playerID: player.id
            ,playerAuth: player.auth
        };

        window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.auth.playerAuth, placeholder), null, 0x479947, "normal", 1);
    } else {
        window.gameRoom._room.sendAnnouncement(LangRes.command.auth._ErrorNoPlayer, null, 0xFF7777, "normal", 2);
    }
}