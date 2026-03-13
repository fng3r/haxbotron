import { PlayerRoles } from "../../model/PlayerRole/PlayerRoles";
import * as LangRes from "../../resource/strings";
import { RoomRuntime } from "../../runtime/RoomRuntime";

export function cmdMap(runtime: RoomRuntime, byPlayer: PlayerObject, mapName: string): void {
    const playerRole = runtime.playerRole.getRole(byPlayer.id)!;
    if(!PlayerRoles.atLeast(playerRole, PlayerRoles.ADM)) {
        runtime.room.sendAnnouncement(LangRes.command.map._ErrorNoPermission, byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    if (runtime.match.isPlaying()) {
        runtime.room.sendAnnouncement(LangRes.command.switch._ErrorGameStartedAlready, byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    if (!runtime.room.setStadiumByName(mapName)) {
        runtime.room.sendAnnouncement(LangRes.command.map._ErrorNoMap, byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    runtime.logger.i('cmdMap', `Map was changed to ${mapName} ${byPlayer.name}#${byPlayer.id}`);
}
