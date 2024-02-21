import {PlayerObject} from "../../model/GameObject/PlayerObject";
import {PlayerRoles} from "../../model/PlayerRole/PlayerRoles";
import * as LangRes from "../../resource/strings";
import * as Tst from "../Translator";
import {loadStadiumData} from "../../../lib/stadiumLoader";

export function cmdMap(byPlayer: PlayerObject, mapName: string): void {
    const placeholder = {
        playerID: byPlayer.id
        ,playerName: byPlayer.name
        ,stadiumName: mapName
    };

    const playerRole = window.gameRoom.playerRoles.get(byPlayer.id)!;
    if(!PlayerRoles.atLeast(playerRole, PlayerRoles.ADM)) {
        window.gameRoom._room.sendAnnouncement(LangRes.command.map._ErrorNoPermission, byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    if (window.gameRoom.isGamingNow) {
        window.gameRoom._room.sendAnnouncement(LangRes.command.switch._ErrorGameStartedAlready, byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    const loadedStadium = loadStadiumData(mapName);
    if (!loadedStadium) {
        window.gameRoom._room.sendAnnouncement(LangRes.command.map._ErrorNoMap, byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }
    window.gameRoom._room.setCustomStadium(loadedStadium);

    window.gameRoom.logger.i('cmdMap', `Map was changed to ${mapName} ${byPlayer.name}#${byPlayer.id}`);
}