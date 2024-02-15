import { PlayerObject } from "../../model/GameObject/PlayerObject";
import {PlayerRoles} from "../../model/PlayerRole/PlayerRoles";

export function onPlayerAdminChangeListener(changedPlayer: PlayerObject, byPlayer: PlayerObject): void {
    /* Event called when a player's admin rights are changed.
            byPlayer is the player which caused the event (can be null if the event wasn't caused by a player). */
    if (byPlayer) {
        window.gameRoom.logger.i('onPlayerAdminChange', `${changedPlayer.name}#${changedPlayer.id} admin rights were taken away by ${byPlayer.name}#${byPlayer.id}`);
        const byPlayerRole = window.gameRoom.playerRoles.get(byPlayer.id);
        if (!PlayerRoles.atLeast(byPlayerRole, PlayerRoles.S_ADM)) { // s-adm+ can remove admin rights anyways
            const changedPlayerRole = window.gameRoom.playerRoles.get(changedPlayer.id);
            if (PlayerRoles.atLeast(changedPlayerRole, PlayerRoles.ADM)) { // if admin rights were taken away from admin+ role, give it back
                window.gameRoom._room.setPlayerAdmin(changedPlayer.id, true);
            }
        }
    }

    window._emitSIOPlayerStatusChangeEvent(changedPlayer.id);
}
