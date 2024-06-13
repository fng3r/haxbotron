import * as LangRes from "../../resource/strings";
import * as Translator from "../Translator";
import { PlayerObject } from "../../model/GameObject/PlayerObject";

export function onGamePauseListener(byPlayer: PlayerObject | null): void {
    window.gameRoom.isGamingNow = false; // turn off
    const announcementText = Translator.maketext(
        LangRes.onGamePause.pausedByPlayer,
        {player: byPlayer?.name});

    window.gameRoom._room.sendAnnouncement(announcementText, null, 0xFFFFFF, "normal", 2);
}
