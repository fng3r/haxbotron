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
import {getUnixTimestamp} from "../DateTimeUtils";
import {updateAdmins} from "../RoomTools";
import {isExistNickname} from "../TextFilter";
import { ServiceContainer } from "../../services/ServiceContainer";

export async function onPlayerJoinListener(player: PlayerObject): Promise<void> {
    const services = ServiceContainer.getInstance();
    const room = services.room.getRoom();
    const playerList = services.player.getPlayerList();
    const config = services.config.getConfig();
    
    const joinTimeStamp: number = getUnixTimestamp();

    // logging into console
    services.logger.i('onPlayerJoin', `${player.name}#${player.id} has joined. CONN(${player.conn}),AUTH(${player.auth})`);

    // Event called when a new player joins the room.
    let placeholderJoin = {
        playerID: player.id,
        playerName: player.name,
        playerNameOld: player.name,
        playerAuth: player.auth,
        playerRole: '',
        banExpirationDate: '',
        banListReason: ''
    };

    // check ban list
    let playerBanChecking = await getBanlistDataFromDB(player.conn);
    if (playerBanChecking !== undefined) {// if banned (bListCheck would had returned string or boolean)
        placeholderJoin.banListReason = playerBanChecking.reason;

        if (playerBanChecking.expire == -1) { // Permanent ban
            services.logger.i('onPlayerJoin', `${player.name}#${player.id} was joined but kicked for registered in permanent ban list. (conn:${player.conn},reason:${playerBanChecking.reason})`);
            room.kickPlayer(player.id, Tst.maketext(LangRes.onJoin.banList.permanentBan, placeholderJoin), false); // auto kick
            return;
        }
        if (playerBanChecking.expire > joinTimeStamp) { // Fixed-term ban (time limited ban)
            placeholderJoin.banExpirationDate = new Date(playerBanChecking.expire).toString();
            services.logger.i('onPlayerJoin', `${player.name}#${player.id} was joined but kicked for registered in fixed-term ban list. (conn:${player.conn},reason:${playerBanChecking.reason})`);
            room.kickPlayer(player.id, Tst.maketext(LangRes.onJoin.banList.fixedTermBan, placeholderJoin), false); // auto kick
            return;
        }
        if (playerBanChecking.expire != -1 && playerBanChecking.expire <= joinTimeStamp) { // time-over from expiration date
            // ban clear for this player
            services.logger.i('onPlayerJoin', `${player.name}#${player.id} is deleted from the ban list because the date has expired. (conn:${player.conn},reason:${playerBanChecking.reason})`);
            await removeBanlistDataFromDB(player.conn);
        }
    }

    // if this player use seperator (|,|) in nickname, then kick
    if (player.name.includes('|,|')) {
        services.logger.i('onPlayerJoin', `${player.name}#${player.id} was joined but kicked for including seperator word. (|,|)`);
        room.kickPlayer(player.id, Tst.maketext(LangRes.onJoin.includeSeperator, placeholderJoin), false); // kick
        return;
    }
    
    // if this player has already joinned by other connection
    // for (let eachPlayer of playerList.values()) {
    //     if(eachPlayer.conn === player.conn) {
    //         services.logger.i('onPlayerJoin', `${player.name}#${player.id} was joined but kicked for double joinning. (origin:${eachPlayer.name}#${eachPlayer.id},conn:${player.conn})`);
    //         room.kickPlayer(player.id, Tst.maketext(LangRes.onJoin.doubleJoinningKick, placeholderJoin), false); // kick
    //         services.room.sendAnnouncement(Tst.maketext(LangRes.onJoin.doubleJoinningMsg, placeholderJoin), null, 0xFF0000, "normal", 0); // notify
    //         return; // exit from this join event
    //     }
    // }

    // if player's nickname is already used (duplicated nickname)
    if (config.settings.forbidDuplicatedNickname && isExistNickname(player.name)) {
        services.logger.i('onPlayerJoin', `${player.name}#${player.id} was joined but kicked for duplicated nickname.`);
        room.kickPlayer(player.id, Tst.maketext(LangRes.onJoin.duplicatedNickname, placeholderJoin), false); // kick
        return;
    }

    // add the player who joined into playerList by creating class instance
    let existPlayerData = await getPlayerDataFromDB(player.auth);
    if (existPlayerData !== undefined) {
        // if this player is existing player (not new player)
        playerList.set(player.id, new Player(
            player,
            existPlayerData.nicknames.concat(player.name),
            {
            mute: existPlayerData.mute,
            muteExpire: existPlayerData.muteExpire,
            malActCount: existPlayerData.malActCount,
            },
            {
                rejoinCount: existPlayerData.rejoinCount,
                joinDate: joinTimeStamp,
                leftDate: existPlayerData.leftDate,
                matchEntryTime: 0,
            }));

        if (player.name != existPlayerData.name) {
            // if this player changed his/her name
            // notify that fact to other players only once ( it will never be notified if he/she rejoined next time)
            placeholderJoin.playerNameOld = existPlayerData.name
            services.room.sendAnnouncement(Tst.maketext(LangRes.onJoin.changename, placeholderJoin), null, 0xFFFFFF, "small", 0);
        }
    } else {
        // if new player
        // create a Player Object
        playerList.set(player.id, new Player(player, [player.name], {
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

    await setPlayerDataToDB(convertToPlayerStorage(playerList.get(player.id)!)); // register(or update) this player into DB

    let playerRole = await getPlayerRoleFromDB(player.auth);

    // kick player without role or with wrong nickname when whitelist enabled
    if (playerRole === undefined || playerRole.name !== player.name) {
        if (config.rules.whitelistEnabled) {
            room.kickPlayer(player.id, `Unknown public id: ${player.auth}`, false);
            // emit websocket event
            window._emitSIOPlayerInOutEvent(player.id);
            return;
        }
    }
    playerRole = playerRole ?? {
        auth: player.auth,
        name: player.name,
        role: PlayerRoles.PLAYER
    };

    const playersCount = room.getPlayerList().length;
    // last slot should be guarded by admin password
    if (playersCount === config._config.maxPlayers! - 1) {
        room.setPassword(services.config.getAdminPassword());
    }

    if (playersCount === config._config.maxPlayers && !PlayerRoles.atLeast(playerRole, PlayerRoles.S_ADM)) {
        room.kickPlayer(player.id, 'Last slot is reserved for admins', false);
    }

    services.logger.i('onPlayerJoin', `Player ${playerRole.name} with public id ${playerRole.auth} has role '${playerRole.role}'`);

    services.playerRole.setRole(player.id, playerRole);
    placeholderJoin.playerRole = playerRole.role;

    services.room.sendAnnouncement(Tst.maketext(LangRes.onJoin.playerJoined, placeholderJoin), null, 0xFFFFFF, "small", 0);

    if (PlayerRoles.atLeast(playerRole, PlayerRoles.ADM)) {
        room.setPlayerAdmin(player.id, true);
    }

    if (config.rules.autoAdmin) { // if auto admin option is enabled
        updateAdmins(); // check there are any admin players, if not make an admin player.
    }

    // send notice
    const notice = services.notification.getNotice();
    if(notice !== '') {
        services.room.sendAnnouncement(notice, player.id, 0x55AADD, "bold", 0);
    }

    // emit websocket event
    window._emitSIOPlayerInOutEvent(player.id);
}
