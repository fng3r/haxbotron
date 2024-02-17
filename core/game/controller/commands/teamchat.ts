import {PlayerObject} from "../../model/GameObject/PlayerObject";
import {TeamID} from "../../model/GameObject/TeamID";

export function cmdTeamChat(byPlayer: PlayerObject, message: string): void {
    const messageColor = getMessageColor(byPlayer.team);
    const messagePrefix = getMessagePrefix(byPlayer.team);
    const resultMessage = `${messagePrefix} ${byPlayer.name}: ${message}`;
    for (const player of window.gameRoom.playerList.values()) {
        if (player.team === byPlayer.team) {
            window.gameRoom._room.sendAnnouncement(resultMessage, player.id, messageColor, "bold", 1);
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