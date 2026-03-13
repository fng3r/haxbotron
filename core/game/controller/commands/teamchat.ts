import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { TeamID } from "../../model/GameObject/TeamID";
import * as LangRes from "../../resource/strings";
import { ServiceContainer } from "../../services/ServiceContainer";

export function cmdTeamChat(byPlayer: PlayerObject, message: string): void {
    const services = ServiceContainer.getInstance();
    const playerList = services.player.getPlayerList();
    
    const player = playerList.get(byPlayer.id)!;
    if (services.chat.isMessageBlockedByMute(player)) {
        services.room.sendAnnouncement(LangRes.onChat.mutedChat, player.id, 0xFF0000, "bold", 2);
        return;
    }

    const messageColor = getMessageColor(byPlayer.team);
    const messagePrefix = getMessagePrefix(byPlayer.team);
    const resultMessage = `${messagePrefix} ${byPlayer.name}: ${message}`;
    for (const player of playerList.values()) {
        if (player.team === byPlayer.team) {
            services.room.sendAnnouncement(resultMessage, player.id, messageColor, "bold", 1);
        }
    }
}

const getMessageColor = (teamId: TeamID): number => {
    if (teamId === TeamID.Red) {
        return 0xbf3f3f;
    }

    if (teamId === TeamID.Blue) {
        return 0x3049C3;
    }

    return 0xffffff;
}

const getMessagePrefix = (teamId: TeamID): string => {
    if (teamId === TeamID.Red) {
        return '[RED]';
    }

    if (teamId === TeamID.Blue) {
        return '[BLUE]';
    }

    return '[SPEC]';
}