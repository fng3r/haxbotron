import {PlayerObject} from "../../model/GameObject/PlayerObject";
import {PlayerRoles} from "../../model/PlayerRole/PlayerRoles";

export function cmdStaff(byPlayer: PlayerObject): void {
    const [...players] = window.gameRoom.playerList.values();
    let staffPlayersString = players
        .filter(player => PlayerRoles.atLeast(window.gameRoom.playerRoles.get(player.id)!, PlayerRoles.S_ADM))
        .map(player => {
            const playerRole = window.gameRoom.playerRoles.get(player.id)!.role;
            return `${player.name}#${player.id} (${playerRole})`;
        })
        .join(', ');
    staffPlayersString = `👨🏻‍💼 Staff: ${staffPlayersString || 'No staff players'}`;

    window.gameRoom._room.sendAnnouncement(staffPlayersString, null, 0x479947, "normal", 1);
}