import { PlayerRoles } from "../../model/PlayerRole/PlayerRoles";
import { RoomRuntime } from "../../runtime/RoomRuntime";

export function cmdStaff(runtime: RoomRuntime, byPlayer: PlayerObject): void {
    const playerList = runtime.player.getPlayerList();
    
    const entries = []
    for (const player of playerList.values()) {
        const role = runtime.playerRole.getRole(player.id);
        if (!role) {
            continue;
        }

        if (PlayerRoles.atLeast(role, PlayerRoles.S_ADM)) {
            entries.push(`${player.name}#${player.id} (${role.role})`);
        }
    }
    const staffPlayersString = `👨🏻‍💼 Staff: ${entries.join(', ') || 'No staff players'}`;

    runtime.room.sendAnnouncement(staffPlayersString, null, 0x479947, "normal", 1);
}
