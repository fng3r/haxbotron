import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { PlayerRoles } from "../../model/PlayerRole/PlayerRoles";
import * as LangRes from "../../resource/strings";
import { ServiceContainer } from "../../services/ServiceContainer";

export function cmdMap(byPlayer: PlayerObject, mapName: string): void {
    const services = ServiceContainer.getInstance();

    const playerRole = services.playerRole.getRole(byPlayer.id)!;
    if(!PlayerRoles.atLeast(playerRole, PlayerRoles.ADM)) {
        services.room.sendAnnouncement(LangRes.command.map._ErrorNoPermission, byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    if (services.match.isPlaying()) {
        services.room.sendAnnouncement(LangRes.command.switch._ErrorGameStartedAlready, byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    if (!services.room.setStadiumByName(mapName)) {
        services.room.sendAnnouncement(LangRes.command.map._ErrorNoMap, byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    services.logger.i('cmdMap', `Map was changed to ${mapName} ${byPlayer.name}#${byPlayer.id}`);
}