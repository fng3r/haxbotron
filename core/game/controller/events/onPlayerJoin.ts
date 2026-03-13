import * as Tst from "../Translator";
import * as LangRes from "../../resource/strings";
import {PlayerObject} from "../../model/GameObject/PlayerObject";
import {PlayerRoles} from "../../model/PlayerRole/PlayerRoles";
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
    const joinBanResult = await services.ban.evaluateJoinBan(player.conn, joinTimeStamp);
    if (joinBanResult.ban) {
        placeholderJoin.banListReason = joinBanResult.ban.reason;
    }
    if (joinBanResult.status === "permanent_ban") {
        services.logger.i('onPlayerJoin', `${player.name}#${player.id} was joined but kicked for registered in permanent ban list. (conn:${player.conn},reason:${joinBanResult.ban!.reason})`);
        room.kickPlayer(player.id, Tst.maketext(LangRes.onJoin.banList.permanentBan, placeholderJoin), false); // auto kick
        return;
    }
    if (joinBanResult.status === "temporary_ban_active") {
        placeholderJoin.banExpirationDate = new Date(joinBanResult.ban!.expire).toString();
        services.logger.i('onPlayerJoin', `${player.name}#${player.id} was joined but kicked for registered in fixed-term ban list. (conn:${player.conn},reason:${joinBanResult.ban!.reason})`);
        room.kickPlayer(player.id, Tst.maketext(LangRes.onJoin.banList.fixedTermBan, placeholderJoin), false); // auto kick
        return;
    }
    if (joinBanResult.status === "temporary_ban_expired") {
        services.logger.i('onPlayerJoin', `${player.name}#${player.id} is deleted from the ban list because the date has expired. (conn:${player.conn},reason:${joinBanResult.ban!.reason})`);
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

    // hydrate and persist player profile
    const hydration = await services.playerOnboarding.hydratePlayer(player, joinTimeStamp);
    playerList.set(player.id, hydration.player);
    await services.playerOnboarding.persistPlayer(hydration.player);

    if (hydration.previousName) {
        placeholderJoin.playerNameOld = hydration.previousName;
        services.room.sendAnnouncement(Tst.maketext(LangRes.onJoin.changename, placeholderJoin), null, 0xFFFFFF, "small", 0);
    }

    const roleResolution = await services.playerOnboarding.resolveRole(player.auth, player.name, config.rules.whitelistEnabled);

    // kick player without role or with wrong nickname when whitelist enabled
    if (roleResolution.shouldRejectUnknown) {
        room.kickPlayer(player.id, `Unknown public id: ${player.auth}`, false);
        // emit websocket event
        window._emitSIOPlayerInOutEvent(player.id);
        return;
    }
    const playerRole = roleResolution.role;

    const playersCount = room.getPlayerList().length;
    // last slot should be guarded by admin password
    if (services.room.shouldEnableReservedSlotPassword(playersCount, config._config.maxPlayers!)) {
        room.setPassword(services.config.getAdminPassword());
    }

    if (services.room.isReservedSlotViolation(playersCount, config._config.maxPlayers!, PlayerRoles.atLeast(playerRole, PlayerRoles.S_ADM))) {
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
