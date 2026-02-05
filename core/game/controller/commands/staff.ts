import {PlayerObject} from "../../model/GameObject/PlayerObject";
import {PlayerRoles} from "../../model/PlayerRole/PlayerRoles";
import { ServiceContainer } from "../../services/ServiceContainer";

export function cmdStaff(byPlayer: PlayerObject): void {
    const services = ServiceContainer.getInstance();
    const playerList = services.player.getPlayerList();
    
    const [...players] = playerList.values();
    let staffPlayersString = players
        .filter(player => PlayerRoles.atLeast(services.playerRole.getRole(player.id)!, PlayerRoles.S_ADM))
        .map(player => {
            const playerRole = services.playerRole.getRole(player.id)!.role;
            return `${player.name}#${player.id} (${playerRole})`;
        })
        .join(', ');
    staffPlayersString = `👨🏻‍💼 Staff: ${staffPlayersString || 'No staff players'}`;

    services.room.sendAnnouncement(staffPlayersString, null, 0x479947, "normal", 1);
}