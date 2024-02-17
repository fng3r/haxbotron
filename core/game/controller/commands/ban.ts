import { getUnixTimestamp } from "../DateTimeUtils";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import * as LangRes from "../../resource/strings";
import * as Tst from "../Translator";
import {PlayerRoles} from "../../model/PlayerRole/PlayerRoles";
import {setBanlistDataToDB} from "../Storage";
import {extractPlayerIdentifier, isPlayerId, PlayerId} from "../../model/PlayerIdentifier/PlayerIdentifier";

export function cmdBan(byPlayer: PlayerObject, playerIdentifier: string, banDuration?: number): void {
    const playerRole = window.gameRoom.playerRoles.get(byPlayer.id);
    if(!PlayerRoles.atLeast(playerRole, PlayerRoles.S_ADM)) {
        window.gameRoom._room.sendAnnouncement(LangRes.command.mute._ErrorNoPermission, byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    const playerIdentifier1 = extractPlayerIdentifier(playerIdentifier);

    if(isPlayerId(playerIdentifier1)) {
        const playerId = (playerIdentifier1 as PlayerId).id;
        const banInMinutes = banDuration || -1;
        if (window.gameRoom.playerList.has(playerId)) {
            const player = window.gameRoom.playerList.get(playerId)!;
            let placeholder = {
                targetName: window.gameRoom.playerList.get(playerId)!.name
                , ticketTarget: playerId
                , byPlayerName: byPlayer.name
                , byPlayerId: byPlayer.id
                , banInMinutes: banInMinutes
            };
            const currentTimestamp: number = getUnixTimestamp();

            if (banInMinutes === -1) {
                setBanlistDataToDB({conn: player.conn, reason: '', register: currentTimestamp, expire: -1});
                window.gameRoom._room.kickPlayer(player.id, Tst.maketext(LangRes.onKick.banned.permanentBan, placeholder), false);
                window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.ban.successPermaBan, placeholder), null, 0x479947, "normal", 1);
            } else {
                const expirationTimestamp = currentTimestamp + banInMinutes * 60 * 1000;
                setBanlistDataToDB({
                    conn: player.conn,
                    reason: '',
                    register: currentTimestamp,
                    expire: expirationTimestamp
                });
                window.gameRoom._room.kickPlayer(player.id, Tst.maketext(LangRes.onKick.banned.tempBan, placeholder), false);
                window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.ban.successTempBan, placeholder), null, 0x479947, "normal", 1);
            }

            window._emitSIOPlayerStatusChangeEvent(byPlayer.id);
        } else {
            window.gameRoom._room.sendAnnouncement(LangRes.command.ban._ErrorNoPlayer, byPlayer.id, 0xFF7777, "normal", 2);
        }
    }
}
