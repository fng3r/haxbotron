import * as LangRes from "../../resource/strings";
import * as Translator from "../Translator";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { ServiceContainer } from "../../services/ServiceContainer";

export function onGamePauseListener(byPlayer: PlayerObject | null): void {
    const services = ServiceContainer.getInstance();
    
    services.match.setPlaying(false);
    const announcementText = Translator.maketext(
        LangRes.onGamePause.pausedByPlayer,
        {player: byPlayer?.name});

    services.room.sendAnnouncement(announcementText, null, 0xFFFFFF, "normal", 2);
}
