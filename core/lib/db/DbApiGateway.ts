import axios, { AxiosInstance, AxiosResponse } from "axios";
import { BanList } from "../../game/model/PlayerBan/BanList";
import { PlayerStorage } from "../../game/model/GameObject/PlayerState";
import { PlayerRole } from "../../game/model/PlayerRole/PlayerRole";
import { getDbConnectionUrl } from "../config";

type QueryValue = string | number | undefined;

export class DbApiGateway {
    constructor(
        private readonly baseUrl: string = getDbConnectionUrl(),
        private readonly client: AxiosInstance = axios
    ) {}

    private buildQuery(params: Record<string, QueryValue>): string {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
                query.append(key, String(value));
            }
        });
        const queryString = query.toString();
        return queryString ? `?${queryString}` : "";
    }

    // -------------------------------------------------------------------
    // Superadmin operations (injected runtime only)
    // -------------------------------------------------------------------
    public createSuperadmin(ruid: string, key: string, description: string): Promise<AxiosResponse<any>> {
        return this.client.post(`${this.baseUrl}room/${ruid}/superadmin`, { key, description });
    }

    public readSuperadmin(ruid: string, key: string): Promise<AxiosResponse<any>> {
        return this.client.get(`${this.baseUrl}room/${ruid}/superadmin/${key}`);
    }

    public deleteSuperadmin(ruid: string, key: string): Promise<AxiosResponse<any>> {
        return this.client.delete(`${this.baseUrl}room/${ruid}/superadmin/${key}`);
    }

    // -------------------------------------------------------------------
    // Player operations
    // -------------------------------------------------------------------
    public searchPlayers(ruid: string, searchQuery?: string, start?: number, count?: number): Promise<AxiosResponse<any>> {
        const qs = this.buildQuery({
            searchQuery: searchQuery ?? "",
            start,
            count
        });
        return this.client.get(`${this.baseUrl}room/${ruid}/player/search${qs}`);
    }

    public createPlayer(ruid: string, player: PlayerStorage): Promise<AxiosResponse<any>> {
        return this.client.post(`${this.baseUrl}room/${ruid}/player`, player);
    }

    public readPlayer(ruid: string, auth: string): Promise<AxiosResponse<any>> {
        return this.client.get(`${this.baseUrl}room/${ruid}/player/${auth}`);
    }

    public updatePlayer(ruid: string, player: PlayerStorage): Promise<AxiosResponse<any>> {
        return this.client.put(`${this.baseUrl}room/${ruid}/player/${player.auth}`, player);
    }

    public deletePlayer(ruid: string, auth: string): Promise<AxiosResponse<any>> {
        return this.client.delete(`${this.baseUrl}room/${ruid}/player/${auth}`);
    }

    // -------------------------------------------------------------------
    // Banlist operations
    // -------------------------------------------------------------------
    public getBanList(ruid: string, start?: number, count?: number): Promise<AxiosResponse<any>> {
        const qs = this.buildQuery({ start, count });
        return this.client.get(`${this.baseUrl}room/${ruid}/banlist${qs}`);
    }

    public createBan(ruid: string, banList: BanList): Promise<AxiosResponse<any>> {
        return this.client.post(`${this.baseUrl}room/${ruid}/banlist`, banList);
    }

    public readBan(ruid: string, conn: string): Promise<AxiosResponse<any>> {
        return this.client.get(`${this.baseUrl}room/${ruid}/banlist/${conn}`);
    }

    public updateBan(ruid: string, banList: BanList): Promise<AxiosResponse<any>> {
        return this.client.put(`${this.baseUrl}room/${ruid}/banlist/${banList.conn}`, banList);
    }

    public deleteBan(ruid: string, conn: string): Promise<AxiosResponse<any>> {
        return this.client.delete(`${this.baseUrl}room/${ruid}/banlist/${conn}`);
    }

    // -------------------------------------------------------------------
    // Player role operations
    // -------------------------------------------------------------------
    public readPlayerRole(auth: string): Promise<AxiosResponse<any>> {
        return this.client.get(`${this.baseUrl}player-roles/${auth}`);
    }

    public searchPlayerRoles(searchQuery?: string, start?: number, count?: number): Promise<AxiosResponse<any>> {
        const qs = this.buildQuery({
            searchQuery: searchQuery ?? "",
            start,
            count
        });
        return this.client.get(`${this.baseUrl}player-roles/search${qs}`);
    }

    public searchPlayerRoleEvents(searchQuery?: string, start?: number, count?: number): Promise<AxiosResponse<any>> {
        const qs = this.buildQuery({
            searchQuery: searchQuery ?? "",
            start,
            count
        });
        return this.client.get(`${this.baseUrl}player-roles/events${qs}`);
    }

    // API-controller style (body payload)
    public createPlayerRole(auth: string, name: string, role: string): Promise<AxiosResponse<any>> {
        return this.client.post(`${this.baseUrl}player-roles/${auth}`, { name, role });
    }

    public updatePlayerRole(auth: string, name: string, role: string): Promise<AxiosResponse<any>> {
        return this.client.put(`${this.baseUrl}player-roles/${auth}`, { name, role });
    }

    public deletePlayerRole(auth: string, name: string): Promise<AxiosResponse<any>> {
        const qs = this.buildQuery({ name });
        return this.client.delete(`${this.baseUrl}player-roles/${auth}${qs}`);
    }

    // Legacy injected-runtime style (query payload)
    public createPlayerRoleLegacy(playerRole: PlayerRole): Promise<AxiosResponse<any>> {
        const qs = this.buildQuery({ name: playerRole.name, role: playerRole.role });
        return this.client.post(`${this.baseUrl}player-roles/${playerRole.auth}${qs}`);
    }

    public updatePlayerRoleLegacy(playerRole: PlayerRole): Promise<AxiosResponse<any>> {
        const qs = this.buildQuery({ name: playerRole.name, role: playerRole.role });
        return this.client.put(`${this.baseUrl}player-roles/${playerRole.auth}${qs}`);
    }

    public deletePlayerRoleLegacy(playerRole: PlayerRole): Promise<AxiosResponse<any>> {
        const qs = this.buildQuery({ name: playerRole.name });
        return this.client.delete(`${this.baseUrl}player-roles/${playerRole.auth}${qs}`);
    }

    // -------------------------------------------------------------------
    // RUID operations
    // -------------------------------------------------------------------
    public getRuidList(): Promise<AxiosResponse<any>> {
        return this.client.get(`${this.baseUrl}ruidlist`);
    }
}
