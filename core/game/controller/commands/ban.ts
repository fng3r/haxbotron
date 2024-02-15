import { getUnixTimestamp } from "../Statistics";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import * as LangRes from "../../resource/strings";
import * as Tst from "../Translator";
import {PlayerRoles} from "../../model/PlayerRole/PlayerRoles";
import {setBanlistDataToDB} from "../Storage";

export function cmdBan(byPlayer: PlayerObject, message?: string): void {
    const playerRole = window.gameRoom.playerRoles.get(byPlayer.id);
    if(PlayerRoles.atLeast(playerRole, PlayerRoles.S_ADM)) {
        if(message !== undefined && message.charAt(0) == "#") {
            let messageParts = message.split(' ');
            let target: number = parseInt(messageParts[0].substr(1), 10);
            let banInMinutes = messageParts.length > 1 ? parseInt(messageParts[1], 10) : -1;
            banInMinutes = isNaN(banInMinutes) ? -1 : banInMinutes;
            if(!isNaN(target) && window.gameRoom.playerList.has(target)) {
                let placeholder = {
                    targetName: window.gameRoom.playerList.get(target)!.name
                    ,ticketTarget: target
                    ,byPlayerName: byPlayer.name
                    ,byPlayerId: byPlayer.id
                    ,banInMinutes: banInMinutes
                };
                const currentTimestamp: number = getUnixTimestamp();
                const player = window.gameRoom.playerList.get(target)!;

                if (banInMinutes === -1)
                {
                    setBanlistDataToDB({conn: player.conn, reason: '', register: currentTimestamp, expire: -1});
                    window.gameRoom._room.kickPlayer(player.id, Tst.maketext(LangRes.onKick.banned.permanentBan, placeholder), false);
                    window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.ban.successPermaBan, placeholder), null, 0x479947, "normal", 1);
                } else {
                    const expirationTimestamp = currentTimestamp + banInMinutes * 60 * 1000;
                    setBanlistDataToDB({conn: player.conn, reason: '', register: currentTimestamp, expire: expirationTimestamp});
                    window.gameRoom._room.kickPlayer(player.id, Tst.maketext(LangRes.onKick.banned.tempBan, placeholder), false);
                    window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.ban.successTempBan, placeholder), null, 0x479947, "normal", 1);
                }

                window._emitSIOPlayerStatusChangeEvent(byPlayer.id);
            } else {
                window.gameRoom._room.sendAnnouncement(LangRes.command.ban._ErrorNoPlayer, byPlayer.id, 0xFF7777, "normal", 2);
            }
        } else {
            window.gameRoom._room.sendAnnouncement(LangRes.command.ban._ErrorNoPlayer, byPlayer.id, 0xFF7777, "normal", 2);
        }
    } else {
        window.gameRoom._room.sendAnnouncement(LangRes.command.ban._ErrorNoPermission, byPlayer.id, 0xFF7777, "normal", 2);
    }
}
