import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { ServiceContainer } from "../../services/ServiceContainer";

export function onPlayerAdminChangeListener(changedPlayer: PlayerObject, byPlayer: PlayerObject): void {
    /* Event called when a player's admin rights are changed.
            byPlayer is the player which caused the event (can be null if the event wasn't caused by a player). */
    const services = ServiceContainer.getInstance();
    const room = services.room.getRoom();
    
    if (byPlayer) {
        services.logger.i('onPlayerAdminChange', `${changedPlayer.name}#${changedPlayer.id} admin rights were taken away by ${byPlayer.name}#${byPlayer.id}`);
        if (services.playerRole.shouldRestoreAdminAfterRemoval(changedPlayer.id, byPlayer.id)) {
            room.setPlayerAdmin(changedPlayer.id, true);
        }

        if (services.playerRole.shouldForceRemoveAdmin(changedPlayer.id) && changedPlayer.admin) {
            room.setPlayerAdmin(changedPlayer.id, false);
        }
    }

    window._emitSIOPlayerStatusChangeEvent(changedPlayer.id);
}
