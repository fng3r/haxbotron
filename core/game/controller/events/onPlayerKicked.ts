import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { getUnixTimestamp } from "../DateTimeUtils";
import { getBanlistDataFromDB, setBanlistDataToDB } from "../Storage";
import {PlayerRoles} from "../../model/PlayerRole/PlayerRoles";

export async function onPlayerKickedListener(kickedPlayer: PlayerObject, reason: string, ban: boolean, byPlayer: PlayerObject): Promise<void> {
    /* Event called when a player has been kicked from the room. This is always called after the onPlayerLeave event.
        byPlayer is the player which caused the event (can be null if the event wasn't caused by a player). */
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

    const existingKickedPlayer = window.gameRoom.playerList.get(kickedPlayer.id);
    if (byPlayer !== null && byPlayer.id != 0) {
        placeholderKick.kickerID = byPlayer.id;
        placeholderKick.kickerName = byPlayer.name;
        const playerRole = window.gameRoom.playerRoles.get(byPlayer.id)!;
        if (!PlayerRoles.atLeast(playerRole, PlayerRoles.S_ADM)) {
            // if the player who acted banning is not s-adm+
            window.gameRoom._room.kickPlayer(byPlayer.id, '', false);
            window.gameRoom.logger.i('onPlayerKicked', `${kickedPlayer.name}#${kickedPlayer.id} has been banned by ${byPlayer.name}#${byPlayer.id} (reason:${placeholderKick.reason}), but it is negated.`);
        } else { // if by super admin player
            if (ban) { // ban
                const existingBan = await getBanlistDataFromDB(existingKickedPlayer!.conn);
                if (!existingBan) {
                    setBanlistDataToDB({ conn: existingKickedPlayer!.conn, auth: existingKickedPlayer!.auth, reason: reason, register: kickedTime, expire: -1 }); // register into ban list
                }
                window.gameRoom.logger.i('onPlayerKicked', `${kickedPlayer.name}#${kickedPlayer.id} has been banned by ${byPlayer.name}#${byPlayer.id}. (reason:${placeholderKick.reason}).`);
            } else { // kick
                window.gameRoom.logger.i('onPlayerKicked', `${kickedPlayer.name}#${kickedPlayer.id} has been kicked by ${byPlayer.name}#${byPlayer.id}. (reason:${placeholderKick.reason})`);
            }
        }
    } else {
        if (ban) { // ban
            const existingBan = await getBanlistDataFromDB(existingKickedPlayer!.conn);
            if (!existingBan) {
                setBanlistDataToDB({ conn: existingKickedPlayer!.conn, auth: existingKickedPlayer!.auth, reason: reason, register: kickedTime, expire: -1 }); // register into ban list
            }
        }
        window.gameRoom.logger.i('onPlayerKicked', `${kickedPlayer.name}#${kickedPlayer.id} has been kicked. (ban:${ban},reason:${placeholderKick.reason})`);
    }

    window.gameRoom._room.clearBan(kickedPlayer.id); // Remove ban in the room since we added player in banlist so he would be kicked on join otherwise.

    const playersCount = window.gameRoom._room.getPlayerList().length;
    // reset password to default one when more than one slot become available
    if (playersCount === window.gameRoom.config._config.maxPlayers! - 2) {
        window.gameRoom._room.setPassword(window.gameRoom.config._config.password || null);
    }
}
