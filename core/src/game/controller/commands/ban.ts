import type { PlayerObject } from "haxball.js";
import { extractPlayerIdentifier, isPlayerId, PlayerId } from "../../model/PlayerIdentifier/PlayerIdentifier.js";
import { PlayerRoles } from "../../model/PlayerRole/PlayerRoles.js";
import * as Messages from "../../resource/strings.js";
import { emitPlayerStatusChange } from "../../runtime/WorkerEventBridge.js";
import { RoomRuntime } from "../../runtime/RoomRuntime.js";
import { getRemainingTimeString, getUnixTimestamp } from "../../shared/DateTime.js";
import * as Tst from "../../shared/Translator.js";

export async function cmdBan(runtime: RoomRuntime, byPlayer: PlayerObject, playerIdentifier: string, banDuration?: number): Promise<void> {
    const room = runtime.room.getRoom();
    const playerList = runtime.players.getPlayerList();
    
    const playerRole = runtime.playerRoles.getRole(byPlayer.id)!;
    if(!PlayerRoles.atLeast(playerRole, PlayerRoles.S_ADM)) {
        runtime.room.sendAnnouncement(Messages.command._ErrorNoPermission, byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    const playerIdentifier1 = extractPlayerIdentifier(playerIdentifier);

    if(isPlayerId(playerIdentifier1)) {
        const playerId = (playerIdentifier1 as PlayerId).id;
        const banInMinutes = banDuration || -1;
        if (playerList.has(playerId)) {
            const player = playerList.get(playerId)!;
            const currentTimestamp: number = getUnixTimestamp();

            if (banInMinutes === -1) {
                await runtime.bans.upsertBan(
                    runtime.bans.createPermanentBan(player.conn, player.auth, '', currentTimestamp)
                );
                room.kickPlayer(player.id, Tst.maketext(Messages.onKick.banned.permanentBan, { playerName: player.name }), false);
                runtime.room.sendAnnouncement(Tst.maketext(Messages.command.ban.successPermaBan, {
                    targetName: player.name
                    ,ticketTarget: playerId
                    ,byPlayerName: byPlayer.name
                    ,byPlayerId: byPlayer.id
                }), null, 0x479947, "normal", 1);
            } else {
                await runtime.bans.upsertBan(
                    runtime.bans.createTemporaryBan(player.conn, player.auth, '', currentTimestamp, banInMinutes * 60 * 1000)
                );
                room.kickPlayer(player.id, Tst.maketext(Messages.onKick.banned.tempBan, { banInMinutes }), false);
                runtime.room.sendAnnouncement(Tst.maketext(Messages.command.ban.successTempBan, {
                    targetName: player.name
                    ,ticketTarget: playerId
                    ,byPlayerName: byPlayer.name
                    ,byPlayerId: byPlayer.id
                    ,banInMinutes: banInMinutes
                }), null, 0x479947, "normal", 1);
            }

            emitPlayerStatusChange(byPlayer.id);
        } else {
            runtime.room.sendAnnouncement(Messages.command._ErrorNoPlayer, byPlayer.id, 0xFF7777, "normal", 2);
        }
    }
}

export async function cmdBans(runtime: RoomRuntime, byPlayer: PlayerObject): Promise<void> {
    const banEntries = await runtime.bans.getBanDisplayEntries();
    if (banEntries === undefined) {
        runtime.room.sendAnnouncement(Messages.command.bans._ErrorFailedToGet, null, 0xFF7777, "normal", 2);
        return;
    }

    if (banEntries.length === 0) {
        runtime.room.sendAnnouncement(Messages.command.bans.noBans, null, 0x479947, "normal", 1);
    } else {
        const bannedPlayersString = banEntries.map(banEntry => `${banEntry.playerName} (${getRemainingTimeString(banEntry.expire)})`).join(', ');
        runtime.room.sendAnnouncement(Tst.maketext(Messages.command.bans.allBans, {bannedPlayers: bannedPlayersString}), null, 0x479947, "normal", 1);
    }
}
