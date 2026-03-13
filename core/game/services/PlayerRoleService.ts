import { PlayerRole } from "../model/PlayerRole/PlayerRole";
import { PlayerRoles } from "../model/PlayerRole/PlayerRoles";

/**
 * Service for managing player roles (admin, staff, etc.)
 */
export class PlayerRoleService {
    private playerRoles: Map<number, PlayerRole>;

    constructor() {
        this.playerRoles = new Map();
    }

    public getRoles(): Map<number, PlayerRole> {
        return this.playerRoles;
    }

    public getRole(playerId: number): PlayerRole | undefined {
        return this.playerRoles.get(playerId);
    }

    public setRole(playerId: number, role: PlayerRole): void {
        this.playerRoles.set(playerId, role);
    }

    public removeRole(playerId: number): void {
        this.playerRoles.delete(playerId);
    }

    public hasRole(playerId: number): boolean {
        return this.playerRoles.has(playerId);
    }

    public getRoleName(playerId: number): string | undefined {
        const role = this.playerRoles.get(playerId);
        return role ? role.role : undefined;
    }

    public getAllRoles(): PlayerRole[] {
        return Array.from(this.playerRoles.values());
    }

    public shouldRestoreAdminAfterRemoval(changedPlayerId: number, byPlayerId: number): boolean {
        const byPlayerRole = this.getRole(byPlayerId);
        const changedPlayerRole = this.getRole(changedPlayerId);
        if (!byPlayerRole || !changedPlayerRole) {
            return false;
        }

        return PlayerRoles.less(byPlayerRole, changedPlayerRole);
    }

    public shouldForceRemoveAdmin(changedPlayerId: number): boolean {
        const changedPlayerRole = this.getRole(changedPlayerId);
        if (!changedPlayerRole) {
            return false;
        }

        return changedPlayerRole.role === PlayerRoles.BAD;
    }
}
