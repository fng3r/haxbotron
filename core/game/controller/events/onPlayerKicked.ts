import type { PlayerObject } from "haxball.js";
import { Player } from "../../model/GameObject/Player";
import { PlayerRoles } from "../../model/PlayerRole/PlayerRoles";
import { RoomRuntime } from "../../runtime/RoomRuntime";
import { getUnixTimestamp } from "../../shared/DateTime";

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
    const actingPlayer = byPlayer !== null && byPlayer.id !== 0 ? byPlayer : null;
    const actingPlayerRole = actingPlayer !== null
        ? runtime.playerRoles.getRole(actingPlayer.id)
        : undefined;
    const isAuthorizedAction = actingPlayer === null
        || (actingPlayerRole !== undefined && PlayerRoles.atLeast(actingPlayerRole, PlayerRoles.S_ADM));

    if (isAuthorizedAction) {
        if (ban) {
            if (!existingKickedPlayer) {
                runtime.logger.w(
                    'onPlayerKicked',
                    `Could not persist ban for ${kickedPlayer.name}#${kickedPlayer.id} because the player is not in memory.`
                );
                return;
            }
            await addBan(runtime, existingKickedPlayer, reason, kickedTime);
        }
        runtime.logger.i('onPlayerKicked', `${kickedPlayer.name}#${kickedPlayer.id} has been kicked. (ban:${ban}, reason:${placeholderKick.reason})`);
    } else {
        room.kickPlayer(actingPlayer.id, 'You are not allowed to kick/ban other players', false);
        runtime.logger.i('onPlayerKicked', `${kickedPlayer.name}#${kickedPlayer.id} has been kicked by ${actingPlayer.name}#${actingPlayer.id}, but it is negated.`);
    }

    room.clearBan(kickedPlayer.id); // Remove the native room ban because the persistent ban entry now handles rejoin kicks.
}


const addBan = async (runtime: RoomRuntime, bannedPlayer: Player, reason: string, timestamp: number) => {
    const existingBan = await runtime.bans.getBan(bannedPlayer.conn);
    if (!existingBan) {
        await runtime.bans.upsertBan(
            runtime.bans.createPermanentBan(bannedPlayer.conn, bannedPlayer.auth, reason, timestamp)
        );
    }
}
