import { getUnixTimestamp } from "../Statistics";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import * as LangRes from "../../resource/strings";
import * as Tst from "../Translator";
import { PlayerRoles } from "../../model/PlayerRole/PlayerRoles";

export function cmdMute(byPlayer: PlayerObject, message?: string): void {
    const playerRole = window.gameRoom.playerRoles.get(byPlayer.id);
    if(PlayerRoles.atLeast(playerRole, PlayerRoles.S_ADM)) {
        if(message !== undefined && message.charAt(0) == "#") {
            let messageParts = message.split(' ');
            let target: number = parseInt(messageParts[0].substr(1), 10);
            let muteInMinutes = messageParts.length > 1 ? parseInt(messageParts[1], 10) : -1;
            muteInMinutes = isNaN(muteInMinutes) ? -1 : muteInMinutes;
            if(!isNaN(target) && window.gameRoom.playerList.has(target)) {
                let placeholder = {
                    targetName: window.gameRoom.playerList.get(target)!.name
                    ,ticketTarget: target
                    ,byPlayerName: byPlayer.name
                    ,byPlayerId: byPlayer.id
                    ,muteInMinutes: muteInMinutes
                };
                if(window.gameRoom.playerList.get(target)!.permissions.mute) {
                    window.gameRoom.playerList.get(target)!.permissions.mute = false; //unmute
                    window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.mute.successUnmute, placeholder), null, 0x479947, "normal", 1);
                } else {
                    if (muteInMinutes === -1)
                    {
                        window.gameRoom.playerList.get(target)!.permissions.mute = true;
                        window.gameRoom.playerList.get(target)!.permissions.muteExpire = -1;
                        window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.mute.successPermaMute, placeholder), null, 0x479947, "normal", 1);
                    } else {
                        const currentTimestamp: number = getUnixTimestamp();
                        const expirationTimestamp = currentTimestamp + muteInMinutes * 60 * 1000;
                        window.gameRoom.playerList.get(target)!.permissions.mute = true;
                        window.gameRoom.playerList.get(target)!.permissions.muteExpire = expirationTimestamp;
                        window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.mute.successTempMute, placeholder), null, 0x479947, "normal", 1);
                    }

                }

                window._emitSIOPlayerStatusChangeEvent(byPlayer.id);
            } else {
                window.gameRoom._room.sendAnnouncement(LangRes.command.mute._ErrorNoPlayer, byPlayer.id, 0xFF7777, "normal", 2);
            }
        } else {
            window.gameRoom._room.sendAnnouncement(LangRes.command.mute._ErrorNoPlayer, byPlayer.id, 0xFF7777, "normal", 2);
        }
    } else {
        window.gameRoom._room.sendAnnouncement(LangRes.command.mute._ErrorNoPermission, byPlayer.id, 0xFF7777, "normal", 2);
    }
}
