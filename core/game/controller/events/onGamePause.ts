import * as LangRes from "../../resource/strings";
import { RoomRuntime } from "../../runtime/RoomRuntime";
import * as Translator from "../Translator";

export function onGamePauseListener(runtime: RoomRuntime, byPlayer: PlayerObject | null): void {
    runtime.match.setPlaying(false);
    const announcementText = Translator.maketext(
        LangRes.onGamePause.pausedByPlayer,
        {player: byPlayer?.name});

    runtime.room.sendAnnouncement(announcementText, null, 0xFFFFFF, "normal", 2);
}
