import { emitPlayerStatusChange } from "../../runtime/WorkerEventBridge";
import { RoomRuntime } from "../../runtime/RoomRuntime";

export function onPlayerAdminChangeListener(runtime: RoomRuntime, changedPlayer: PlayerObject, byPlayer: PlayerObject | null): void {
    /* Event called when a player's admin rights are changed.
            byPlayer is the player which caused the event (can be null if the event wasn't caused by a player). */
    const room = runtime.room.getRoom();
    
    if (byPlayer) {
        runtime.logger.i('onPlayerAdminChange', `${changedPlayer.name}#${changedPlayer.id} admin rights were taken away by ${byPlayer.name}#${byPlayer.id}`);
        if (runtime.playerRoles.shouldRestoreAdminAfterRemoval(changedPlayer.id, byPlayer.id)) {
            room.setPlayerAdmin(changedPlayer.id, true);
        }

        if (runtime.playerRoles.shouldForceRemoveAdmin(changedPlayer.id) && changedPlayer.admin) {
            room.setPlayerAdmin(changedPlayer.id, false);
        }
    }

    emitPlayerStatusChange(changedPlayer.id);
}
