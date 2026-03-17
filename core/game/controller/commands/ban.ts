import { extractPlayerIdentifier, isPlayerId, PlayerId } from "../../model/PlayerIdentifier/PlayerIdentifier";
import { PlayerRoles } from "../../model/PlayerRole/PlayerRoles";
import * as LangRes from "../../resource/strings";
import { emitPlayerStatusChange } from "../../runtime/WorkerEventBridge";
import { RoomRuntime } from "../../runtime/RoomRuntime";
import { getRemainingTimeString, getUnixTimestamp } from "../DateTimeUtils";
import * as Tst from "../Translator";

export async function cmdBan(runtime: RoomRuntime, byPlayer: PlayerObject, playerIdentifier: string, banDuration?: number): Promise<void> {
    const room = runtime.room.getRoom();
    const playerList = runtime.players.getPlayerList();
    
    const playerRole = runtime.playerRoles.getRole(byPlayer.id)!;
    if(!PlayerRoles.atLeast(playerRole, PlayerRoles.S_ADM)) {
        runtime.room.sendAnnouncement(LangRes.command.mute._ErrorNoPermission, byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    const playerIdentifier1 = extractPlayerIdentifier(playerIdentifier);

    if(isPlayerId(playerIdentifier1)) {
        const playerId = (playerIdentifier1 as PlayerId).id;
        const banInMinutes = banDuration || -1;
        if (playerList.has(playerId)) {
            const player = playerList.get(playerId)!;
            let placeholder = {
                targetName: playerList.get(playerId)!.name
                ,ticketTarget: playerId
                ,byPlayerName: byPlayer.name
                ,byPlayerId: byPlayer.id
                ,banInMinutes: banInMinutes
            };
            const currentTimestamp: number = getUnixTimestamp();

            if (banInMinutes === -1) {
                await runtime.bans.upsertBan(
                    runtime.bans.createPermanentBan(player.conn, player.auth, '', currentTimestamp)
                );
                room.kickPlayer(player.id, Tst.maketext(LangRes.onKick.banned.permanentBan, placeholder), false);
                runtime.room.sendAnnouncement(Tst.maketext(LangRes.command.ban.successPermaBan, placeholder), null, 0x479947, "normal", 1);
            } else {
                await runtime.bans.upsertBan(
                    runtime.bans.createTemporaryBan(player.conn, player.auth, '', currentTimestamp, banInMinutes * 60 * 1000)
                );
                room.kickPlayer(player.id, Tst.maketext(LangRes.onKick.banned.tempBan, placeholder), false);
                runtime.room.sendAnnouncement(Tst.maketext(LangRes.command.ban.successTempBan, placeholder), null, 0x479947, "normal", 1);
            }

            emitPlayerStatusChange(byPlayer.id);
        } else {
            runtime.room.sendAnnouncement(LangRes.command.ban._ErrorNoPlayer, byPlayer.id, 0xFF7777, "normal", 2);
        }
    }
}

export async function cmdBans(runtime: RoomRuntime, byPlayer: PlayerObject): Promise<void> {
    const banEntries = await runtime.bans.getBanDisplayEntries();
    if (banEntries === undefined) {
        runtime.room.sendAnnouncement(LangRes.command.bans._ErrorFailedToGet, null, 0xFF7777, "normal", 2);
        return;
    }

    if (banEntries.length === 0) {
        runtime.room.sendAnnouncement(LangRes.command.bans.noBans, null, 0x479947, "normal", 1);
    } else {
        const bannedPlayersString = banEntries.map(banEntry => `${banEntry.playerName} (${getRemainingTimeString(banEntry.expire)})`).join(', ');
        runtime.room.sendAnnouncement(Tst.maketext(LangRes.command.bans.allBans, {bannedPlayers: bannedPlayersString}), null, 0x479947, "normal", 1);
    }
}
