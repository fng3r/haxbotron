import { PlayerObject } from "../../model/GameObject/PlayerObject";
import * as Translator from "../Translator";
import * as LangRes from "../../resource/strings";
import { ServiceContainer } from "../../services/ServiceContainer";

export function onGameUnpauseListener(byPlayer: PlayerObject | null): void {
    const services = ServiceContainer.getInstance();
    
    services.match.setPlaying(true);
    const announcementText = Translator.maketext(
        LangRes.onGameUnpause.unpausedByPlayer,
        {player: byPlayer?.name}
    );

    services.room.sendAnnouncement(announcementText, null, 0xFFFFFF, "normal", 2);
}
