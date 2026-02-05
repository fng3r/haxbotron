import {PlayerObject} from "../../model/GameObject/PlayerObject";
import {PlayerRoles} from "../../model/PlayerRole/PlayerRoles";
import { ServiceContainer } from "../../services/ServiceContainer";

export function onPlayerAdminChangeListener(changedPlayer: PlayerObject, byPlayer: PlayerObject): void {
    /* Event called when a player's admin rights are changed.
            byPlayer is the player which caused the event (can be null if the event wasn't caused by a player). */
    const services = ServiceContainer.getInstance();
    const room = services.room.getRoom();
    
    if (byPlayer) {
        services.logger.i('onPlayerAdminChange', `${changedPlayer.name}#${changedPlayer.id} admin rights were taken away by ${byPlayer.name}#${byPlayer.id}`);
        const byPlayerRole = services.playerRole.getRole(byPlayer.id)!;
        const changedPlayerRole = services.playerRole.getRole(changedPlayer.id)!;
        if (PlayerRoles.less(byPlayerRole, changedPlayerRole)) { // if admin rights were taken away from lesser role, give it back
            room.setPlayerAdmin(changedPlayer.id, true);
        }

        if (changedPlayerRole.role === PlayerRoles.BAD && changedPlayer.admin) { // BAD players cannot be admins
            room.setPlayerAdmin(changedPlayer.id, false);
        }
    }

    window._emitSIOPlayerStatusChangeEvent(changedPlayer.id);
}
