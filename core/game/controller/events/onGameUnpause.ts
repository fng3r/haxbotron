import * as Translator from "../Translator";
import * as LangRes from "../../resource/strings";
import { RoomRuntime } from "../../runtime/RoomRuntime";

export function onGameUnpauseListener(runtime: RoomRuntime, byPlayer: PlayerObject | null): void {
    runtime.match.setPlaying(true);
    const announcementText = Translator.maketext(
        LangRes.onGameUnpause.unpausedByPlayer,
        {player: byPlayer?.name}
    );

    runtime.room.sendAnnouncement(announcementText, null, 0xFFFFFF, "normal", 2);
}
