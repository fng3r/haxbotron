import * as Tst from "../../shared/Translator";
import * as LangRes from "../../resource/strings";
import {PlayerRoles} from "../../model/PlayerRole/PlayerRoles";
import {getUnixTimestamp} from "../../shared/DateTime";
import {updateAdmins} from "../../runtime/RoomRuntimeHelpers";
import { RoomRuntime } from "../../runtime/RoomRuntime";
import { emitPlayerJoinLeave } from "../../runtime/WorkerEventBridge";

export async function onPlayerJoinListener(runtime: RoomRuntime, player: PlayerJoinObject): Promise<void> {
    const room = runtime.room.getRoom();
    const playerList = runtime.players.getPlayerList();
    const settings = runtime.config.getSettings();
    const rules = runtime.config.getRules();
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

    // Check existing bans for this connection.
    const joinBanResult = await runtime.bans.evaluateJoinBan(player.conn, joinTimeStamp);
    if (joinBanResult.ban) {
        placeholderJoin.banListReason = joinBanResult.ban.reason;
    }
    if (joinBanResult.status === "permanent_ban") {
        runtime.logger.i('onPlayerJoin', `${player.name}#${player.id} joined but was kicked due to a permanent ban. (conn:${player.conn},reason:${joinBanResult.ban!.reason})`);
        room.kickPlayer(player.id, Tst.maketext(LangRes.onJoin.banList.permanentBan, placeholderJoin), false); // auto kick
        return;
    }
    if (joinBanResult.status === "temporary_ban_active") {
        placeholderJoin.banExpirationDate = new Date(joinBanResult.ban!.expire).toString();
        runtime.logger.i('onPlayerJoin', `${player.name}#${player.id} joined but was kicked due to an active temporary ban. (conn:${player.conn},reason:${joinBanResult.ban!.reason})`);
        room.kickPlayer(player.id, Tst.maketext(LangRes.onJoin.banList.fixedTermBan, placeholderJoin), false); // auto kick
        return;
    }
    if (joinBanResult.status === "temporary_ban_expired") {
        runtime.logger.i('onPlayerJoin', `${player.name}#${player.id} was removed from bans because the temporary ban expired. (conn:${player.conn},reason:${joinBanResult.ban!.reason})`);
    }

    // if this player use seperator (|,|) in nickname, then kick
    if (player.name.includes('|,|')) {
        runtime.logger.i('onPlayerJoin', `${player.name}#${player.id} was joined but kicked for including seperator word. (|,|)`);
        room.kickPlayer(player.id, Tst.maketext(LangRes.onJoin.includeSeperator, placeholderJoin), false); // kick
        return;
    }
    
    // if player's nickname is already used (duplicated nickname)
    if (
        settings.forbidDuplicatedNickname &&
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

    const roleResolution = await runtime.playerOnboarding.resolveRole(playerAuth, player.name, rules.whitelistEnabled);

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
    if (runtime.room.shouldEnableReservedSlotPassword(playersCount, runtime.config.getMaxPlayers())) {
        room.setPassword(runtime.config.getAdminPassword());
    }

    if (runtime.room.isReservedSlotViolation(playersCount, runtime.config.getMaxPlayers(), PlayerRoles.atLeast(playerRole, PlayerRoles.S_ADM))) {
        room.kickPlayer(player.id, 'Last slot is reserved for admins', false);
    }

    runtime.logger.i('onPlayerJoin', `Player ${playerRole.name} with public id ${playerRole.auth} has role '${playerRole.role}'`);

    runtime.playerRoles.setRole(player.id, playerRole);
    placeholderJoin.playerRole = playerRole.role;

    runtime.room.sendAnnouncement(Tst.maketext(LangRes.onJoin.playerJoined, placeholderJoin), null, 0xFFFFFF, "small", 0);

    if (PlayerRoles.atLeast(playerRole, PlayerRoles.ADM)) {
        room.setPlayerAdmin(player.id, true);
    }

    if (rules.autoAdmin) { // if auto admin option is enabled
        updateAdmins(runtime); // check there are any admin players, if not make an admin player.
    }

    // send notice
    const notice = runtime.notifications.getNotice();
    if(notice !== '') {
        runtime.room.sendAnnouncement(notice, player.id, 0x55AADD, "bold", 0);
    }

    // emit websocket event
    emitPlayerJoinLeave(player.id);
}
