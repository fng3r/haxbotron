import * as LangRes from "../../resource/strings";
import { RoomRuntime } from "../../runtime/RoomRuntime";
import * as Tst from "../Translator";

export function cmdAbout(runtime: RoomRuntime, byPlayer: PlayerObject): void {
    var placeholder = {
        _LaunchTime: runtime.config.getLaunchDate().toLocaleString()
        ,RoomName: runtime.config.getRoomName() || "Untitled"
    }
    runtime.room.sendAnnouncement(Tst.maketext(LangRes.command.about, placeholder), byPlayer.id, 0x479947, "normal", 1);
}
