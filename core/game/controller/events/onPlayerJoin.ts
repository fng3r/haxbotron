import * as Tst from "../Translator";
import * as LangRes from "../../resource/strings";
import {PlayerObject} from "../../model/GameObject/PlayerObject";
import {PlayerRoles} from "../../model/PlayerRole/PlayerRoles";
import {Player} from "../../model/GameObject/Player";
import {
    convertToPlayerStorage,
    getBanlistDataFromDB,
    getPlayerDataFromDB,
    getPlayerRoleFromDB,
    removeBanlistDataFromDB,
    setPlayerDataToDB
} from "../Storage";
import {getUnixTimestamp} from "../Statistics";
import {updateAdmins} from "../RoomTools";
import {convertTeamID2Name, TeamID} from "../../model/GameObject/TeamID";
import {isExistNickname} from "../TextFilter";

const ADMIN_ROLES = [PlayerRoles.ADM, PlayerRoles.S_ADM, PlayerRoles.CO_HOST];

export async function onPlayerJoinListener(player: PlayerObject): Promise<void> {
    const joinTimeStamp: number = getUnixTimestamp();

    // logging into console
    window.gameRoom.logger.i('onPlayerJoin', `${player.name}#${player.id} has joined. CONN(${player.conn}),AUTH(${player.auth})`);

    // Event called when a new player joins the room.
    var placeholderJoin = {
        playerID: player.id,
        playerName: player.name,
        playerNameOld: player.name,
        playerAuth: player.auth,
        playerRole: '',
        gameRuleName: window.gameRoom.config.rules.ruleName,
        gameRuleLimitTime: window.gameRoom.config.rules.requisite.timeLimit,
        gameRuleLimitScore: window.gameRoom.config.rules.requisite.scoreLimit,
        gameRuleNeedMin: window.gameRoom.config.rules.requisite.minimumPlayers,
        possTeamRed: window.gameRoom.ballStack.possCalculate(TeamID.Red),
        possTeamBlue: window.gameRoom.ballStack.possCalculate(TeamID.Blue),
        streakTeamName: convertTeamID2Name(window.gameRoom.winningStreak.teamID),
        streakTeamCount: window.gameRoom.winningStreak.count,
        banExpirationDate: '',
        banListReason: ''
    };

    // check ban list
    let playerBanChecking = await getBanlistDataFromDB(player.conn);
    if (playerBanChecking !== undefined) {// if banned (bListCheck would had returned string or boolean)
        placeholderJoin.banListReason = playerBanChecking.reason;

        if (playerBanChecking.expire == -1) { // Permanent ban
            window.gameRoom.logger.i('onPlayerJoin', `${player.name}#${player.id} was joined but kicked for registered in permanent ban list. (conn:${player.conn},reason:${playerBanChecking.reason})`);
            window.gameRoom._room.kickPlayer(player.id, Tst.maketext(LangRes.onJoin.banList.permanentBan, placeholderJoin), false); // auto kick
            window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.onJoin.banList.permanentBan, placeholderJoin), null, 0xFF0000, "normal", 0); // auto kick
            return;
        }
        if (playerBanChecking.expire > joinTimeStamp) { // Fixed-term ban (time limited ban)
            placeholderJoin.banExpirationDate = new Date(playerBanChecking.expire).toString();
            window.gameRoom.logger.i('onPlayerJoin', `${player.name}#${player.id} was joined but kicked for registered in fixed-term ban list. (conn:${player.conn},reason:${playerBanChecking.reason})`);
            window.gameRoom._room.kickPlayer(player.id, Tst.maketext(LangRes.onJoin.banList.fixedTermBan, placeholderJoin), false); // auto kick
            window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.onJoin.banList.fixedTermBan, placeholderJoin), null, 0xFF0000, "normal", 0); // auto kick
            return;
        }
        if (playerBanChecking.expire != -1 && playerBanChecking.expire <= joinTimeStamp) { // time-over from expiration date
            // ban clear for this player
            window.gameRoom.logger.i('onPlayerJoin', `${player.name}#${player.id} is deleted from the ban list because the date has expired. (conn:${player.conn},reason:${playerBanChecking.reason})`);
            await removeBanlistDataFromDB(player.conn);
            // window.room.clearBan(player.id); //useless cuz banned player in haxball couldn't make join-event.
        }
    }

    // if this player use seperator (|,|) in nickname, then kick
    if (player.name.includes('|,|')) {
        window.gameRoom.logger.i('onPlayerJoin', `${player.name}#${player.id} was joined but kicked for including seperator word. (|,|)`);
        window.gameRoom._room.kickPlayer(player.id, Tst.maketext(LangRes.onJoin.includeSeperator, placeholderJoin), false); // kick
        return;
    }
    
    // if this player has already joinned by other connection
    // for (let eachPlayer of window.gameRoom.playerList.values()) {
    //     if(eachPlayer.conn === player.conn) {
    //         window.gameRoom.logger.i('onPlayerJoin', `${player.name}#${player.id} was joined but kicked for double joinning. (origin:${eachPlayer.name}#${eachPlayer.id},conn:${player.conn})`);
    //         window.gameRoom._room.kickPlayer(player.id, Tst.maketext(LangRes.onJoin.doubleJoinningKick, placeholderJoin), false); // kick
    //         window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.onJoin.doubleJoinningMsg, placeholderJoin), null, 0xFF0000, "normal", 0); // notify
    //         return; // exit from this join event
    //     }
    // }

    // if player's nickname is already used (duplicated nickname)
    if (window.gameRoom.config.settings.forbidDuplicatedNickname && isExistNickname(player.name)) {
        window.gameRoom.logger.i('onPlayerJoin', `${player.name}#${player.id} was joined but kicked for duplicated nickname.`);
        window.gameRoom._room.kickPlayer(player.id, Tst.maketext(LangRes.onJoin.duplicatedNickname, placeholderJoin), false); // kick
        return;
    }

    // add the player who joined into playerList by creating class instance
    let existPlayerData = await getPlayerDataFromDB(player.auth);
    if (existPlayerData !== undefined) {
        // if this player is existing player (not new player)
        window.gameRoom.playerList.set(player.id, new Player(player, {
            mute: existPlayerData.mute,
            muteExpire: existPlayerData.muteExpire,
            malActCount: existPlayerData.malActCount,
        }, {
            rejoinCount: existPlayerData.rejoinCount,
            joinDate: joinTimeStamp,
            leftDate: existPlayerData.leftDate,
            matchEntryTime: 0
        }));

        if (player.name != existPlayerData.name) {
            // if this player changed his/her name
            // notify that fact to other players only once ( it will never be notified if he/she rejoined next time)
            placeholderJoin.playerNameOld = existPlayerData.name
            window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.onJoin.changename, placeholderJoin), null, 0xFFFFFF, "small", 0);
        }
    } else {
        // if new player
        // create a Player Object
        window.gameRoom.playerList.set(player.id, new Player(player, {
            mute: false,
            muteExpire: 0,
            malActCount: 0,
        }, {
            rejoinCount: 0,
            joinDate: joinTimeStamp,
            leftDate: 0,
            matchEntryTime: 0
        }));
    }

    await setPlayerDataToDB(convertToPlayerStorage(window.gameRoom.playerList.get(player.id)!)); // register(or update) this player into DB

    let playerRole = await getPlayerRoleFromDB(player.auth);

    // kick player without role
    if (playerRole === undefined) {
        if (window.gameRoom.config.rules.whitelistEnabled) {
            window.gameRoom._room.kickPlayer(player.id, `Unknown public id: ${player.auth}`, false);
            // emit websocket event
            window._emitSIOPlayerInOutEvent(player.id);
            return;
        }

        playerRole = {
            auth: player.auth,
            name: player.name,
            role: PlayerRoles.PLAYER
        }
    }

    window.gameRoom.logger.i('onPlayerJoin', `Player ${playerRole.name} with public id ${playerRole.auth} has role '${playerRole.role}'`)

    window.gameRoom.playerRoles.set(player.id, playerRole);
    placeholderJoin.playerRole = playerRole.role;

    window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.onJoin.playerJoined, placeholderJoin), null, 0xFFFFFF, "small", 0);

    if (ADMIN_ROLES.some(role => role == playerRole!.role)) {
        window.gameRoom._room.setPlayerAdmin(player.id, true);
    }

    if (window.gameRoom.config.rules.autoAdmin) { // if auto admin option is enabled
        updateAdmins(); // check there are any admin players, if not make an admin player.
    }

    // send notice
    if(window.gameRoom.notice !== '') {
        window.gameRoom._room.sendAnnouncement(window.gameRoom.notice, player.id, 0x55AADD, "bold", 0);
    }

    // emit websocket event
    window._emitSIOPlayerInOutEvent(player.id);
}
