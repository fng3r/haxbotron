import { PlayerObject } from "../../model/GameObject/PlayerObject";
import * as LangRes from "../../resource/strings";
import { ServiceContainer } from "../../services/ServiceContainer";
import * as Tst from "../Translator";

export function cmdAuth(byPlayer: PlayerObject, playerId?: number): void {
    const services = ServiceContainer.getInstance();
    
    playerId = playerId || byPlayer.id;
    
    const player = services.player.getPlayer(playerId);
    if (!player) {
        services.room.sendAnnouncement(LangRes.command.auth._ErrorNoPlayer, null, 0xFF7777, "normal", 2);
        return;
    }

    const placeholder = {
        playerName: player.name
        ,playerID: player.id
        ,playerAuth: player.auth
    };

    services.room.sendAnnouncement(Tst.maketext(LangRes.command.auth.playerAuth, placeholder), null, 0x479947, "normal", 1);
}