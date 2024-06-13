import { PlayerObject } from "../../model/GameObject/PlayerObject";
import * as Translator from "../Translator";
import * as LangRes from "../../resource/strings";

export function onGameUnpauseListener(byPlayer: PlayerObject | null): void {
    window.gameRoom.isGamingNow = true; // turn on
    const announcementText = Translator.maketext(
        LangRes.onGameUnpause.unpausedByPlayer,
        {player: byPlayer?.name}
    );

    window.gameRoom._room.sendAnnouncement(announcementText, null, 0xFFFFFF, "normal", 2);
}
