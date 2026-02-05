import { PlayerObject } from "../../model/GameObject/PlayerObject";
import * as LangRes from "../../resource/strings";
import * as Tst from "../Translator";
import { ServiceContainer } from "../../services/ServiceContainer";

export function cmdAbout(byPlayer: PlayerObject): void {
    const services = ServiceContainer.getInstance();
    const config = services.config.getConfig();
    
    var placeholder = {
        _LaunchTime: config._LaunchDate.toLocaleString()
        ,RoomName: config._config.roomName || "Untitled"
    }
    services.room.sendAnnouncement(Tst.maketext(LangRes.command.about, placeholder), byPlayer.id, 0x479947, "normal", 1);
}
