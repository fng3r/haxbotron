import type { PlayerObject } from "haxball.js";
import * as Translator from "../../shared/Translator.js";
import * as LangRes from "../../resource/strings.js";
import { RoomRuntime } from "../../runtime/RoomRuntime.js";

export function onGameUnpauseListener(runtime: RoomRuntime, byPlayer: PlayerObject | null): void {
    runtime.match.setPlaying(true);
    const announcementText = Translator.maketext(
        LangRes.onGameUnpause.unpausedByPlayer,
        {player: byPlayer?.name}
    );

    runtime.room.sendAnnouncement(announcementText, null, 0xFFFFFF, "normal", 2);
}
