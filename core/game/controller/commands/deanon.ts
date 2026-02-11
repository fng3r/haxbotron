import { PlayerObject } from "../../model/GameObject/PlayerObject";
import * as LangRes from "../../resource/strings";
import { ServiceContainer } from "../../services/ServiceContainer";
import * as Tst from "../Translator";

export async function cmdDeanon(byPlayer: PlayerObject, playerId: number) {
    const services = ServiceContainer.getInstance();
    const player = services.player.getPlayer(playerId);
    if (player === undefined) {
        services.room.sendAnnouncement(LangRes.command.deanon._ErrorNoPlayer, byPlayer.id, 0xFF7777, "normal", 1);
        return;
    }

    const nicknamesList = Array.from(player.nicknames.values()).join(', ');
    const placeholder = {
        playerID: player.id,
        playerName: player.name,
        nicknamesList: nicknamesList
    }
    services.room.sendAnnouncement(Tst.maketext(LangRes.command.deanon.playerNicknames, placeholder), byPlayer.id, 0x479947, "normal", 1);
}