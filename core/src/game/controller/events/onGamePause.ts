import type { PlayerObject } from "haxball.js";
import * as Messages from "../../resource/strings.js";
import { RoomRuntime } from "../../runtime/RoomRuntime.js";
import * as Translator from "../../shared/Translator.js";
import { recordLiveMatchEvent } from "../../runtime/LiveBroadcast.js";

export function onGamePauseListener(runtime: RoomRuntime, byPlayer: PlayerObject | null): void {
    runtime.match.setPlaying(false);
    recordLiveMatchEvent(runtime, { type: "pause", ...(byPlayer ? { actor: byPlayer } : {}) });
    const announcementText = Translator.maketext(
        Messages.onGamePause.pausedByPlayer,
        {player: byPlayer?.name});

    runtime.room.sendAnnouncement(announcementText, null, 0xFFFFFF, "normal", 2);
}
