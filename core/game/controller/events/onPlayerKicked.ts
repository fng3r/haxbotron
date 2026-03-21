import { getUnixTimestamp } from "../../shared/DateTime";
import {PlayerRoles} from "../../model/PlayerRole/PlayerRoles";
import { RoomRuntime } from "../../runtime/RoomRuntime";

export async function onPlayerKickedListener(runtime: RoomRuntime, kickedPlayer: PlayerObject, reason: string, ban: boolean, byPlayer: PlayerObject | null): Promise<void> {
    /* Event called when a player has been kicked from the room. This is always called after the onPlayerLeave event.
        byPlayer is the player which caused the event (can be null if the event wasn't caused by a player). */
    const room = runtime.room.getRoom();
    const playerList = runtime.players.getPlayerList();
    
    const kickedTime: number = getUnixTimestamp();
    let placeholderKick = {
        kickedID: kickedPlayer.id,
        kickedName: kickedPlayer.name,
        kickerID: 0,
        kickerName: '',
        reason: 'by bot',
    };
    if (reason !== null) {
        placeholderKick.reason = reason;
    }

    const existingKickedPlayer = playerList.get(kickedPlayer.id);
    if (byPlayer !== null && byPlayer.id != 0) {
        placeholderKick.kickerID = byPlayer.id;
        placeholderKick.kickerName = byPlayer.name;
        const playerRole = runtime.playerRoles.getRole(byPlayer.id)!;
        if (!PlayerRoles.atLeast(playerRole, PlayerRoles.S_ADM)) {
            // if the player who acted banning is not s-adm+
            room.kickPlayer(byPlayer.id, '', false);
            runtime.logger.i('onPlayerKicked', `${kickedPlayer.name}#${kickedPlayer.id} has been banned by ${byPlayer.name}#${byPlayer.id} (reason:${placeholderKick.reason}), but it is negated.`);
        } else { // if by super admin player
            if (ban) { // ban
                const existingBan = await runtime.bans.getBan(existingKickedPlayer!.conn);
                if (!existingBan) {
                    await runtime.bans.upsertBan(
                        runtime.bans.createPermanentBan(existingKickedPlayer!.conn, existingKickedPlayer!.auth, reason, kickedTime)
                    ); // persist the new ban entry
                }
                runtime.logger.i('onPlayerKicked', `${kickedPlayer.name}#${kickedPlayer.id} has been banned by ${byPlayer.name}#${byPlayer.id}. (reason:${placeholderKick.reason}).`);
            } else { // kick
                runtime.logger.i('onPlayerKicked', `${kickedPlayer.name}#${kickedPlayer.id} has been kicked by ${byPlayer.name}#${byPlayer.id}. (reason:${placeholderKick.reason})`);
            }
        }
    } else {
        if (ban) { // ban
            const existingBan = await runtime.bans.getBan(existingKickedPlayer!.conn);
            if (!existingBan) {
                await runtime.bans.upsertBan(
                    runtime.bans.createPermanentBan(existingKickedPlayer!.conn, existingKickedPlayer!.auth, reason, kickedTime)
                ); // persist the new ban entry
            }
        }
        runtime.logger.i('onPlayerKicked', `${kickedPlayer.name}#${kickedPlayer.id} has been kicked. (ban:${ban},reason:${placeholderKick.reason})`);
    }

    room.clearBan(kickedPlayer.id); // Remove the native room ban because the persistent ban entry now handles rejoin kicks.

    const playersCount = room.getPlayerList().length;
    // reset password to default one when more than one slot become available
    if (playersCount === runtime.config.getMaxPlayers() - 2) {
        room.setPassword(runtime.config.getRoomPassword() || null);
    }
}
