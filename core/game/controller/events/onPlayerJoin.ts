import * as Tst from "../Translator";
import * as LangRes from "../../resource/strings";
import {PlayerRoles} from "../../model/PlayerRole/PlayerRoles";
import {getUnixTimestamp} from "../DateTimeUtils";
import {updateAdmins} from "../RoomTools";
import { RoomRuntime } from "../../runtime/RoomRuntime";
import { emitPlayerJoinLeave } from "../../runtime/WorkerEventBridge";

export async function onPlayerJoinListener(runtime: RoomRuntime, player: PlayerJoinObject): Promise<void> {
    const room = runtime.room.getRoom();
    const playerList = runtime.player.getPlayerList();
    const config = runtime.config.getConfig();
    const playerAuth = player.auth ?? "";
    
    const joinTimeStamp: number = getUnixTimestamp();

    // logging into console
    runtime.logger.i('onPlayerJoin', `${player.name}#${player.id} has joined. CONN(${player.conn}),AUTH(${playerAuth || "null"})`);

    // Event called when a new player joins the room.
    let placeholderJoin = {
        playerID: player.id,
        playerName: player.name,
        playerNameOld: player.name,
        playerAuth: playerAuth,
        playerRole: '',
        banExpirationDate: '',
        banListReason: ''
    };

    // check ban list
    const joinBanResult = await runtime.ban.evaluateJoinBan(player.conn, joinTimeStamp);
    if (joinBanResult.ban) {
        placeholderJoin.banListReason = joinBanResult.ban.reason;
    }
    if (joinBanResult.status === "permanent_ban") {
        runtime.logger.i('onPlayerJoin', `${player.name}#${player.id} was joined but kicked for registered in permanent ban list. (conn:${player.conn},reason:${joinBanResult.ban!.reason})`);
        room.kickPlayer(player.id, Tst.maketext(LangRes.onJoin.banList.permanentBan, placeholderJoin), false); // auto kick
        return;
    }
    if (joinBanResult.status === "temporary_ban_active") {
        placeholderJoin.banExpirationDate = new Date(joinBanResult.ban!.expire).toString();
        runtime.logger.i('onPlayerJoin', `${player.name}#${player.id} was joined but kicked for registered in fixed-term ban list. (conn:${player.conn},reason:${joinBanResult.ban!.reason})`);
        room.kickPlayer(player.id, Tst.maketext(LangRes.onJoin.banList.fixedTermBan, placeholderJoin), false); // auto kick
        return;
    }
    if (joinBanResult.status === "temporary_ban_expired") {
        runtime.logger.i('onPlayerJoin', `${player.name}#${player.id} is deleted from the ban list because the date has expired. (conn:${player.conn},reason:${joinBanResult.ban!.reason})`);
    }

    // if this player use seperator (|,|) in nickname, then kick
    if (player.name.includes('|,|')) {
        runtime.logger.i('onPlayerJoin', `${player.name}#${player.id} was joined but kicked for including seperator word. (|,|)`);
        room.kickPlayer(player.id, Tst.maketext(LangRes.onJoin.includeSeperator, placeholderJoin), false); // kick
        return;
    }
    
    // if player's nickname is already used (duplicated nickname)
    if (
        config.settings.forbidDuplicatedNickname &&
        Array.from(playerList.values()).some((existingPlayer) => existingPlayer.name.trim() === player.name.trim())
    ) {
        runtime.logger.i('onPlayerJoin', `${player.name}#${player.id} was joined but kicked for duplicated nickname.`);
        room.kickPlayer(player.id, Tst.maketext(LangRes.onJoin.duplicatedNickname, placeholderJoin), false); // kick
        return;
    }

    // hydrate and persist player profile
    const hydration = await runtime.playerOnboarding.hydratePlayer(player, playerAuth, joinTimeStamp);
    playerList.set(player.id, hydration.player);
    await runtime.playerOnboarding.persistPlayer(hydration.player);

    if (hydration.previousName) {
        placeholderJoin.playerNameOld = hydration.previousName;
        runtime.room.sendAnnouncement(Tst.maketext(LangRes.onJoin.changename, placeholderJoin), null, 0xFFFFFF, "small", 0);
    }

    const roleResolution = await runtime.playerOnboarding.resolveRole(playerAuth, player.name, config.rules.whitelistEnabled);

    // kick player without role or with wrong nickname when whitelist enabled
    if (roleResolution.shouldRejectUnknown) {
        room.kickPlayer(player.id, `Unknown public id: ${playerAuth}`, false);
        // emit websocket event
        emitPlayerJoinLeave(player.id);
        return;
    }
    const playerRole = roleResolution.role;

    const playersCount = room.getPlayerList().length;
    // last slot should be guarded by admin password
    if (runtime.room.shouldEnableReservedSlotPassword(playersCount, config._config.maxPlayers!)) {
        room.setPassword(runtime.config.getAdminPassword());
    }

    if (runtime.room.isReservedSlotViolation(playersCount, config._config.maxPlayers!, PlayerRoles.atLeast(playerRole, PlayerRoles.S_ADM))) {
        room.kickPlayer(player.id, 'Last slot is reserved for admins', false);
    }

    runtime.logger.i('onPlayerJoin', `Player ${playerRole.name} with public id ${playerRole.auth} has role '${playerRole.role}'`);

    runtime.playerRole.setRole(player.id, playerRole);
    placeholderJoin.playerRole = playerRole.role;

    runtime.room.sendAnnouncement(Tst.maketext(LangRes.onJoin.playerJoined, placeholderJoin), null, 0xFFFFFF, "small", 0);

    if (PlayerRoles.atLeast(playerRole, PlayerRoles.ADM)) {
        room.setPlayerAdmin(player.id, true);
    }

    if (config.rules.autoAdmin) { // if auto admin option is enabled
        updateAdmins(runtime); // check there are any admin players, if not make an admin player.
    }

    // send notice
    const notice = runtime.notification.getNotice();
    if(notice !== '') {
        runtime.room.sendAnnouncement(notice, player.id, 0x55AADD, "bold", 0);
    }

    // emit websocket event
    emitPlayerJoinLeave(player.id);
}
