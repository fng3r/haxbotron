import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { extractPlayerIdentifier, isPlayerId, PlayerId } from "../../model/PlayerIdentifier/PlayerIdentifier";
import { PlayerRoles } from "../../model/PlayerRole/PlayerRoles";
import { getInjectedDBRepository } from "../../repositories/InjectedDBRepository";
import * as LangRes from "../../resource/strings";
import { ServiceContainer } from "../../services/ServiceContainer";
import { getRemainingTimeString, getUnixTimestamp } from "../DateTimeUtils";
import * as Tst from "../Translator";

export async function cmdBan(byPlayer: PlayerObject, playerIdentifier: string, banDuration?: number): Promise<void> {
    const services = ServiceContainer.getInstance();
    const room = services.room.getRoom();
    const playerList = services.player.getPlayerList();
    
    const playerRole = services.playerRole.getRole(byPlayer.id)!;
    if(!PlayerRoles.atLeast(playerRole, PlayerRoles.S_ADM)) {
        services.room.sendAnnouncement(LangRes.command.mute._ErrorNoPermission, byPlayer.id, 0xFF7777, "normal", 2);
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
                await services.ban.upsertBan(
                    services.ban.createPermanentBan(player.conn, player.auth, '', currentTimestamp)
                );
                room.kickPlayer(player.id, Tst.maketext(LangRes.onKick.banned.permanentBan, placeholder), false);
                services.room.sendAnnouncement(Tst.maketext(LangRes.command.ban.successPermaBan, placeholder), null, 0x479947, "normal", 1);
            } else {
                await services.ban.upsertBan(
                    services.ban.createTemporaryBan(player.conn, player.auth, '', currentTimestamp, banInMinutes * 60 * 1000)
                );
                room.kickPlayer(player.id, Tst.maketext(LangRes.onKick.banned.tempBan, placeholder), false);
                services.room.sendAnnouncement(Tst.maketext(LangRes.command.ban.successTempBan, placeholder), null, 0x479947, "normal", 1);
            }

            window._emitSIOPlayerStatusChangeEvent(byPlayer.id);
        } else {
            services.room.sendAnnouncement(LangRes.command.ban._ErrorNoPlayer, byPlayer.id, 0xFF7777, "normal", 2);
        }
    }
}

export async function cmdBans(byPlayer: PlayerObject): Promise<void> {
    const services = ServiceContainer.getInstance();
    const repository = getInjectedDBRepository();
    
    const bans = await services.ban.getAllBans();
    if (bans === undefined) {
        services.room.sendAnnouncement(LangRes.command.bans._ErrorFailedToGet, null, 0xFF7777, "normal", 2);
        return;
    }

    if (bans!.length === 0) {
        services.room.sendAnnouncement(LangRes.command.bans.noBans, null, 0x479947, "normal", 1);
    } else {
        const bannedPlayersStrings = [];
        for (const ban of bans) {
            let player = await repository.readPlayer(ban.auth);
            bannedPlayersStrings.push(Tst.maketext(LangRes.command.bans.singleBan, {
                playerName: player!.name,
                banInMinutes: getRemainingTimeString(ban.expire)
            }));
        }

        services.room.sendAnnouncement(Tst.maketext(LangRes.command.bans.allBans, {bannedPlayers: bannedPlayersStrings.join(', ')}), null, 0x479947, "normal", 1);
    }
}
