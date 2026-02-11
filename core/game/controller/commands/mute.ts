import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { extractPlayerIdentifier, isPlayerId, PlayerId } from "../../model/PlayerIdentifier/PlayerIdentifier";
import { PlayerRoles } from "../../model/PlayerRole/PlayerRoles";
import * as LangRes from "../../resource/strings";
import { ServiceContainer } from "../../services/ServiceContainer";
import { getRemainingTimeString, getUnixTimestamp } from "../DateTimeUtils";
import * as Tst from "../Translator";

export function cmdMute(byPlayer: PlayerObject, playerIdentifier: string, muteDuration?: number): void {
    const services = ServiceContainer.getInstance();
    const playerList = services.player.getPlayerList();
    
    const playerRole = services.playerRole.getRole(byPlayer.id)!;
    if(!PlayerRoles.atLeast(playerRole, PlayerRoles.S_ADM)) {
        services.room.sendAnnouncement(LangRes.command.mute._ErrorNoPermission, byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }
    const playerIdentifier1 = extractPlayerIdentifier(playerIdentifier);

    if(isPlayerId(playerIdentifier1)) {
        const playerId = (playerIdentifier1 as PlayerId).id;
        const muteInMinutes = muteDuration || -1;
        if (playerList.has(playerId)) {
            const player = playerList.get(playerId)!;
            const placeholder = {
                targetName: player.name
                ,targetId: playerId
                ,byPlayerName: byPlayer.name
                ,byPlayerId: byPlayer.id
                ,muteInMinutes: muteInMinutes
            };
            const action = services.chat.toggleMute(player, muteInMinutes, getUnixTimestamp());
            if (action === "unmuted") {
                services.room.sendAnnouncement(Tst.maketext(LangRes.command.mute.successUnmute, placeholder), null, 0x479947, "normal", 1);
            } else if (action === "muted_permanently") {
                services.room.sendAnnouncement(Tst.maketext(LangRes.command.mute.successPermaMute, placeholder), null, 0x479947, "normal", 1);
            } else if (action === "muted_temporarily") {
                services.room.sendAnnouncement(Tst.maketext(LangRes.command.mute.successTempMute, placeholder), null, 0x479947, "normal", 1);
            }

            window._emitSIOPlayerStatusChangeEvent(byPlayer.id);
        } else {
            services.room.sendAnnouncement(LangRes.command.mute._ErrorNoPlayer, byPlayer.id, 0xFF7777, "normal", 2);
        }
    }
}

export function cmdMutes(byPlayer: PlayerObject): void {
    const services = ServiceContainer.getInstance();
    const playerList = services.player.getPlayerList();
    
    const [...players] = playerList.values();
    let mutedPlayersString = players
        .filter(player => player.permissions.mute)
        .map(player => {
            const remainingTime = getRemainingTimeString(player.permissions.muteExpire);
            return `${player.name}#${player.id} (${remainingTime})`;
        })
        .join(', ');
    mutedPlayersString = `🔇 ${mutedPlayersString || 'No muted players'}`;

    services.room.sendAnnouncement(mutedPlayersString, null, 0x479947, "normal", 1);
}