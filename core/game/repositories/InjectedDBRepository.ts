import { Player } from "../model/GameObject/Player";
import { PlayerStorage } from "../model/GameObject/PlayerObject";
import { BanList } from "../model/PlayerBan/BanList";
import { PlayerRole } from "../model/PlayerRole/PlayerRole";

/**
 * Adapter over injected browser functions exposed by RoomLifecycleService.
 * Keeps direct window._* access in one place.
 */
export class InjectedDBRepository {
    public toPlayerStorage(player: Player): PlayerStorage {
        return {
            auth: player.auth,
            conn: player.conn,
            name: player.name,
            mute: player.permissions.mute,
            muteExpire: player.permissions.muteExpire,
            rejoinCount: player.entrytime.rejoinCount,
            joinDate: player.entrytime.joinDate,
            leftDate: player.entrytime.leftDate,
            nicknames: Array.from(player.nicknames.values()),
            malActCount: player.permissions.malActCount
        };
    }

    public async createPlayer(player: PlayerStorage): Promise<void> {
        const ruid = this.getRuid();
        await window._createPlayerDB(ruid, player);
    }

    public async readPlayer(auth: string): Promise<PlayerStorage | undefined> {
        const ruid = this.getRuid();
        return await window._readPlayerDB(ruid, auth);
    }

    public async updatePlayer(player: PlayerStorage): Promise<void> {
        const ruid = this.getRuid();
        await window._updatePlayerDB(ruid, player);
    }

    public async deletePlayer(auth: string): Promise<void> {
        const ruid = this.getRuid();
        await window._deletePlayerDB(ruid, auth);
    }

    public async upsertPlayer(player: PlayerStorage): Promise<void> {
        const existing = await this.readPlayer(player.auth);
        if (existing !== undefined) {
            await this.updatePlayer(player);
            return;
        }
        await this.createPlayer(player);
    }

    public async createPlayerRole(playerRole: PlayerRole): Promise<void> {
        await window._createPlayerRoleDB(playerRole);
    }

    public async readPlayerRole(auth: string): Promise<PlayerRole | undefined> {
        return await window._getPlayerRoleDB(auth);
    }

    public async updatePlayerRole(playerRole: PlayerRole): Promise<void> {
        await window._setPlayerRoleDB(playerRole);
    }

    public async deletePlayerRole(playerRole: PlayerRole): Promise<void> {
        await window._deletePlayerRoleDB(playerRole);
    }

    public async createBan(banList: BanList): Promise<void> {
        const ruid = this.getRuid();
        await window._createBanlistDB(ruid, banList);
    }

    public async readBan(conn: string): Promise<BanList | undefined> {
        const ruid = this.getRuid();
        return await window._readBanlistDB(ruid, conn);
    }

    public async readAllBans(): Promise<BanList[]> {
        const ruid = this.getRuid();
        return await window._getAllBansDB(ruid);
    }

    public async updateBan(banList: BanList): Promise<void> {
        const ruid = this.getRuid();
        await window._updateBanlistDB(ruid, banList);
    }

    public async deleteBan(conn: string): Promise<void> {
        const ruid = this.getRuid();
        await window._deleteBanlistDB(ruid, conn);
    }

    public async upsertBan(banList: BanList): Promise<void> {
        const existing = await this.readBan(banList.conn);
        if (existing !== undefined) {
            await this.updateBan(banList);
            return;
        }
        await this.createBan(banList);
    }

    private getRuid(): string {
        const services = window.services;
        if (!services) {
            throw new Error("ServiceContainer is not available on window");
        }
        return services.config.getRUID();
    }
}

let injectedDBRepositoryInstance: InjectedDBRepository | null = null;

export function getInjectedDBRepository(): InjectedDBRepository {
    if (!injectedDBRepositoryInstance) {
        injectedDBRepositoryInstance = new InjectedDBRepository();
    }
    return injectedDBRepositoryInstance;
}
