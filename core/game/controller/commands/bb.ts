import {PlayerObject} from "../../model/GameObject/PlayerObject";

export function cmdBb(byPlayer: PlayerObject): void {
    window.gameRoom._room.kickPlayer(byPlayer.id, '!bb', false);
}