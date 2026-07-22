import type { PlayerObject } from "haxball.js";
import * as LangRes from "../../resource/strings.js";
import { RoomRuntime } from "../../runtime/RoomRuntime.js";
import * as Translator from "../../shared/Translator.js";

export function onGamePauseListener(runtime: RoomRuntime, byPlayer: PlayerObject | null): void {
    runtime.match.setPlaying(false);
    const announcementText = Translator.maketext(
        LangRes.onGamePause.pausedByPlayer,
        {player: byPlayer?.name});

    runtime.room.sendAnnouncement(announcementText, null, 0xFFFFFF, "normal", 2);
}
