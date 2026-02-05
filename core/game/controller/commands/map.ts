import {PlayerObject} from "../../model/GameObject/PlayerObject";
import {PlayerRoles} from "../../model/PlayerRole/PlayerRoles";
import * as LangRes from "../../resource/strings";
import * as Tst from "../Translator";
import {loadStadiumData} from "../../../lib/stadiumLoader";
import { ServiceContainer } from "../../services/ServiceContainer";

export function cmdMap(byPlayer: PlayerObject, mapName: string): void {
    const services = ServiceContainer.getInstance();
    const room = services.room.getRoom();
    
    const placeholder = {
        playerID: byPlayer.id
        ,playerName: byPlayer.name
        ,stadiumName: mapName
    };

    const playerRole = services.playerRole.getRole(byPlayer.id)!;
    if(!PlayerRoles.atLeast(playerRole, PlayerRoles.ADM)) {
        services.room.sendAnnouncement(LangRes.command.map._ErrorNoPermission, byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    if (services.match.isPlaying()) {
        services.room.sendAnnouncement(LangRes.command.switch._ErrorGameStartedAlready, byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    const loadedStadium = loadStadiumData(mapName);
    if (!loadedStadium) {
        services.room.sendAnnouncement(LangRes.command.map._ErrorNoMap, byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }
    room.setCustomStadium(loadedStadium);

    services.logger.i('cmdMap', `Map was changed to ${mapName} ${byPlayer.name}#${byPlayer.id}`);
}