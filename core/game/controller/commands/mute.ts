import {getRemainingTimeString, getUnixTimestamp} from "../DateTimeUtils";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import * as LangRes from "../../resource/strings";
import * as Tst from "../Translator";
import { PlayerRoles } from "../../model/PlayerRole/PlayerRoles";
import {extractPlayerIdentifier, isPlayerId, PlayerId} from "../../model/PlayerIdentifier/PlayerIdentifier";

export function cmdMute(byPlayer: PlayerObject, playerIdentifier: string, muteDuration?: number): void {
    const playerRole = window.gameRoom.playerRoles.get(byPlayer.id);
    if(!PlayerRoles.atLeast(playerRole, PlayerRoles.S_ADM)) {
        window.gameRoom._room.sendAnnouncement(LangRes.command.mute._ErrorNoPermission, byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }
    const playerIdentifier1 = extractPlayerIdentifier(playerIdentifier);

    if(isPlayerId(playerIdentifier1)) {
        const playerId = (playerIdentifier1 as PlayerId).id;
        const muteInMinutes = muteDuration || -1;
        if (window.gameRoom.playerList.has(playerId)) {
            const player = window.gameRoom.playerList.get(playerId)!;
            const placeholder = {
                targetName: player.name
                ,ticketTarget: playerId
                ,byPlayerName: byPlayer.name
                ,byPlayerId: byPlayer.id
                ,muteInMinutes: muteInMinutes
            };
            if(player.permissions.mute) {
                player.permissions.mute = false; //unmute
                window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.mute.successUnmute, placeholder), null, 0x479947, "normal", 1);
            } else {
                if (muteInMinutes === -1)
                {
                    player.permissions.mute = true;
                    player.permissions.muteExpire = -1;
                    window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.mute.successPermaMute, placeholder), null, 0x479947, "normal", 1);
                } else {
                    const currentTimestamp: number = getUnixTimestamp();
                    const expirationTimestamp = currentTimestamp + muteInMinutes * 60 * 1000;
                    player.permissions.mute = true;
                    player.permissions.muteExpire = expirationTimestamp;
                    window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.mute.successTempMute, placeholder), null, 0x479947, "normal", 1);
                }

            }

            window._emitSIOPlayerStatusChangeEvent(byPlayer.id);
        } else {
            window.gameRoom._room.sendAnnouncement(LangRes.command.mute._ErrorNoPlayer, byPlayer.id, 0xFF7777, "normal", 2);
        }
    }
}

export function cmdMutes(byPlayer: PlayerObject): void {
    const [...players] = window.gameRoom.playerList.values();
    let mutedPlayersString = players
        .filter(player => player.permissions.mute)
        .map(player => {
            const remainingTime = getRemainingTimeString(player.permissions.muteExpire);
            return `${player.name}#${player.id} (${remainingTime})`;
        })
        .join(', ');
    mutedPlayersString = `🔇 ${mutedPlayersString || 'No muted players'}`;

    window.gameRoom._room.sendAnnouncement(mutedPlayersString, null, 0x479947, "normal", 1);
}