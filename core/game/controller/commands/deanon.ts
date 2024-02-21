import {PlayerObject} from "../../model/GameObject/PlayerObject";
import * as LangRes from "../../resource/strings";
import * as Tst from "../Translator";

export async function cmdDeanon(byPlayer: PlayerObject, playerId: number) {
    const player = window.gameRoom.playerList.get(playerId);
    if (player === undefined) {
        window.gameRoom._room.sendAnnouncement(LangRes.command.deanon._ErrorNoPlayer, byPlayer.id, 0xFF7777, "normal", 1);
    }

    const nicknamesList = Array.from(player!.nicknames.values()).join(', ');
    const placeholder = {
        playerID: player!.id,
        playerName: player!.name,
        nicknamesList: nicknamesList
    }
    window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.deanon.playerNicknames, placeholder), byPlayer.id, 0x479947, "normal", 1);
}