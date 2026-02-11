import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { PlayerRoles } from "../../model/PlayerRole/PlayerRoles";
import { ServiceContainer } from "../../services/ServiceContainer";

export function cmdStaff(byPlayer: PlayerObject): void {
    const services = ServiceContainer.getInstance();
    const playerList = services.player.getPlayerList();
    
    const entries = []
    for (const player of playerList.values()) {
        const role = services.playerRole.getRole(player.id);
        if (!role) {
            continue;
        }

        if (PlayerRoles.atLeast(role, PlayerRoles.S_ADM)) {
            entries.push(`${player.name}#${player.id} (${role.role})`);
        }
    }
    const staffPlayersString = `👨🏻‍💼 Staff: ${entries.join(', ') || 'No staff players'}`;

    services.room.sendAnnouncement(staffPlayersString, null, 0x479947, "normal", 1);
}