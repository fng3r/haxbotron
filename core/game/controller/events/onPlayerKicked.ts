import * as Tst from "../Translator";
import * as LangRes from "../../resource/strings";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { getUnixTimestamp } from "../Statistics";
import { convertTeamID2Name, TeamID } from "../../model/GameObject/TeamID";
import { setBanlistDataToDB } from "../Storage";
import {PlayerRoles} from "../../model/PlayerRole/PlayerRoles";

const PRIVILEGED_ROLES = [PlayerRoles.S_ADM, PlayerRoles.CO_HOST];

export function onPlayerKickedListener(kickedPlayer: PlayerObject, reason: string, ban: boolean, byPlayer: PlayerObject): void {
    /* Event called when a player has been kicked from the room. This is always called after the onPlayerLeave event.
        byPlayer is the player which caused the event (can be null if the event wasn't caused by a player). */
    let kickedTime: number = getUnixTimestamp();
    var placeholderKick = {
        kickedID: kickedPlayer.id,
        kickedName: kickedPlayer.name,
        kickerID: 0,
        kickerName: '',
        reason: 'by bot',
        gameRuleName: window.gameRoom.config.rules.ruleName,
        gameRuleLimitTime: window.gameRoom.config.rules.requisite.timeLimit,
        gameRuleLimitScore: window.gameRoom.config.rules.requisite.scoreLimit,
        gameRuleNeedMin: window.gameRoom.config.rules.requisite.minimumPlayers,
        possTeamRed: window.gameRoom.ballStack.possCalculate(TeamID.Red),
        possTeamBlue: window.gameRoom.ballStack.possCalculate(TeamID.Blue),
        streakTeamName: convertTeamID2Name(window.gameRoom.winningStreak.teamID),
        streakTeamCount: window.gameRoom.winningStreak.count
    };
    if (reason !== null) {
        placeholderKick.reason = reason;
    }

    const existingKickedPlayer = window.gameRoom.playerList.get(kickedPlayer.id);
    if (byPlayer !== null && byPlayer.id != 0) {
        placeholderKick.kickerID = byPlayer.id;
        placeholderKick.kickerName = byPlayer.name;
        const playerRole = window.gameRoom.playerRoles.get(byPlayer.id);
        if (!PRIVILEGED_ROLES.some(role => role === playerRole.role)) {
            // if the player who acted banning is not super admin
            window.gameRoom._room.kickPlayer(byPlayer.id, '', false);
            window.gameRoom.logger.i('onPlayerKicked', `${kickedPlayer.name}#${kickedPlayer.id} has been banned by ${byPlayer.name}#${byPlayer.id} (reason:${placeholderKick.reason}), but it is negated.`);
        } else { // if by super admin player
            if (ban) { // ban
                setBanlistDataToDB({ conn: existingKickedPlayer!.conn, reason: reason, register: kickedTime, expire: -1 }); // register into ban list
                window.gameRoom.logger.i('onPlayerKicked', `${kickedPlayer.name}#${kickedPlayer.id} has been banned by ${byPlayer.name}#${byPlayer.id}. (reason:${placeholderKick.reason}).`);
            } else { // kick
                window.gameRoom.logger.i('onPlayerKicked', `${kickedPlayer.name}#${kickedPlayer.id} has been kicked by ${byPlayer.name}#${byPlayer.id}. (reason:${placeholderKick.reason})`);
            }
        }
    } else {
        if (ban) { // ban
            setBanlistDataToDB({ conn: existingKickedPlayer!.conn, reason: placeholderKick.reason, register: kickedTime, expire: -1 }); // register into ban list
        }
        window.gameRoom.logger.i('onPlayerKicked', `${kickedPlayer.name}#${kickedPlayer.id} has been kicked. (ban:${ban},reason:${placeholderKick.reason})`);
    }

    window.gameRoom._room.clearBan(kickedPlayer.id); // Remove ban in the room since we added player in banlist so he would be kicked on join otherwise.
}
