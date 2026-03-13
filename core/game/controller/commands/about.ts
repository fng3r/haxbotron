import * as LangRes from "../../resource/strings";
import { RoomRuntime } from "../../runtime/RoomRuntime";
import * as Tst from "../Translator";

export function cmdAbout(runtime: RoomRuntime, byPlayer: PlayerObject): void {
    const config = runtime.config.getConfig();
    
    var placeholder = {
        _LaunchTime: config._LaunchDate.toLocaleString()
        ,RoomName: config._config.roomName || "Untitled"
    }
    runtime.room.sendAnnouncement(Tst.maketext(LangRes.command.about, placeholder), byPlayer.id, 0x479947, "normal", 1);
}
