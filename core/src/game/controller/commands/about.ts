import type { PlayerObject } from "haxball.js";
import * as Messages from "../../resource/strings.js";
import { RoomRuntime } from "../../runtime/RoomRuntime.js";
import * as Tst from "../../shared/Translator.js";

export function cmdAbout(runtime: RoomRuntime, byPlayer: PlayerObject): void {
    var placeholder = {
        _LaunchTime: runtime.config.getLaunchDate().toLocaleString()
        ,RoomName: runtime.config.getRoomName() || "Untitled"
    }
    runtime.room.sendAnnouncement(Tst.maketext(Messages.command.about, placeholder), byPlayer.id, 0x479947, "normal", 1);
}
