import {PlayerObject} from "../../model/GameObject/PlayerObject";
import * as LangRes from "../../resource/strings";
import * as Tst from "../Translator";
import { ServiceContainer } from "../../services/ServiceContainer";

export function cmdAuth(byPlayer: PlayerObject, playerId?: number): void {
    const services = ServiceContainer.getInstance();
    const playerList = services.player.getPlayerList();
    
    playerId = playerId || byPlayer.id;

    if (playerList.has(playerId)) {
        const player = playerList.get(playerId)!;
        let placeholder = {
            playerName: player.name
            ,playerID: player.id
            ,playerAuth: player.auth
        };

        services.room.sendAnnouncement(Tst.maketext(LangRes.command.auth.playerAuth, placeholder), null, 0x479947, "normal", 1);
    } else {
        services.room.sendAnnouncement(LangRes.command.auth._ErrorNoPlayer, null, 0xFF7777, "normal", 2);
    }
}