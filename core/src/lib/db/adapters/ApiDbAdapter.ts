import { BanEntry } from "../../../game/model/PlayerBan/BanEntry.js";
import { PlayerStorage } from "../../../game/model/GameObject/PlayerState.js";
import { DbApiGateway } from "../DbApiGateway.js";
import type { PersistedRoomConfig, ReactHostRoomInfo } from "../../room/RoomHostConfig.js";

/**
 * API-facing adapter.
 * Keeps behavior thin: return data and let callers map errors.
 */
export class ApiDbAdapter {
    constructor(private readonly gateway: DbApiGateway = new DbApiGateway()) {}

    public async searchPlayerRoles(searchQuery?: string, start?: number, count?: number): Promise<any[]> {
        const response = await this.gateway.searchPlayerRoles(searchQuery, start, count);
        return response.data;
    }

    public async createPlayerRole(auth: string, name: string, role: string): Promise<void> {
        await this.gateway.createPlayerRole(auth, name, role);
    }

    public async updatePlayerRole(auth: string, name: string, role: string): Promise<void> {
        await this.gateway.updatePlayerRole(auth, name, role);
    }

    public async deletePlayerRole(auth: string, name: string): Promise<void> {
        await this.gateway.deletePlayerRole(auth, name);
    }

    public async searchPlayerRoleEvents(searchQuery?: string, start?: number, count?: number): Promise<any[]> {
        const response = await this.gateway.searchPlayerRoleEvents(searchQuery, start, count);
        return response.data;
    }

    public async searchPlayers(ruid: string, searchQuery?: string, start?: number, count?: number): Promise<any[]> {
        const response = await this.gateway.searchPlayers(ruid, searchQuery, start, count);
        return response.data;
    }

    public async getPlayerByAuth(ruid: string, auth: string): Promise<any> {
        const response = await this.gateway.readPlayer(ruid, auth);
        return response.data;
    }

    public async getBanList(ruid: string, start?: number, count?: number): Promise<any[]> {
        const response = await this.gateway.getBanList(ruid, start, count);
        return response.data;
    }

    public async getBanByConn(ruid: string, conn: string): Promise<any> {
        const response = await this.gateway.readBan(ruid, conn);
        return response.data;
    }

    public async createBan(ruid: string, banData: BanEntry): Promise<void> {
        await this.gateway.createBan(ruid, banData);
    }

    public async deleteBan(ruid: string, conn: string): Promise<void> {
        await this.gateway.deleteBan(ruid, conn);
    }

    public async getRuidList(): Promise<any[]> {
        const response = await this.gateway.getRuidList();
        return response.data;
    }

    public async getRoomConfigs(): Promise<PersistedRoomConfig[]> {
        return (await this.gateway.getRoomConfigs()).data;
    }

    public async getRoomConfig(ruid: string): Promise<PersistedRoomConfig> {
        return (await this.gateway.getRoomConfig(ruid)).data;
    }

    public async saveRoomConfig(config: ReactHostRoomInfo): Promise<PersistedRoomConfig> {
        return (await this.gateway.saveRoomConfig(config)).data;
    }

    public async deleteRoomConfig(ruid: string): Promise<void> {
        await this.gateway.deleteRoomConfig(ruid);
    }

    // Methods shared with the room runtime adapter when both paths use the same DB API.
    public async createPlayer(ruid: string, player: PlayerStorage): Promise<void> {
        await this.gateway.createPlayer(ruid, player);
    }
}

export const apiDbAdapter = new ApiDbAdapter();
