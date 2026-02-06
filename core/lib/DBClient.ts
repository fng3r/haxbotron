import axios, { AxiosInstance } from "axios";
import { getDbConnectionUrl } from "./config";

export class DBClient {
    private client: AxiosInstance;
    private baseUrl: string;

    constructor() {
        this.baseUrl = getDbConnectionUrl();
        this.client = axios.create();
        axios.defaults.withCredentials = true;
    }

    // ===================================================================
    // Player Roles Operations
    // ===================================================================

    async searchPlayerRoles(
        searchQuery?: string,
        start?: number,
        count?: number
    ): Promise<any[]> {
        const params = new URLSearchParams();
        params.append('searchQuery', searchQuery || '');
        if (start !== undefined) params.append('start', start.toString());
        if (count !== undefined) params.append('count', count.toString());
        
        const queryString = params.toString();
        const url = `${this.baseUrl}player-roles/search${queryString ? '?' + queryString : ''}`;
        
        const response = await this.client.get(url);
        return response.data;
    }

    async createPlayerRole(auth: string, name: string, role: string): Promise<void> {
        await this.client.post(`${this.baseUrl}player-roles/${auth}`, { name, role });
    }

    async updatePlayerRole(auth: string, name: string, role: string): Promise<void> {
        await this.client.put(`${this.baseUrl}player-roles/${auth}`, { name, role });
    }

    async deletePlayerRole(auth: string, name: string): Promise<void> {
        await this.client.delete(`${this.baseUrl}player-roles/${auth}?name=${encodeURIComponent(name)}`);
    }

    async searchPlayerRoleEvents(
        searchQuery?: string,
        start?: number,
        count?: number
    ): Promise<any[]> {
        const params = new URLSearchParams();
        params.append('searchQuery', searchQuery || '');
        if (start !== undefined) params.append('start', start.toString());
        if (count !== undefined) params.append('count', count.toString());
        
        const queryString = params.toString();
        const url = `${this.baseUrl}player-roles/events${queryString ? '?' + queryString : ''}`;
        
        const response = await this.client.get(url);
        return response.data;
    }

    // ===================================================================
    // Player List Operations
    // ===================================================================

    async searchPlayers(
        ruid: string,
        searchQuery?: string,
        start?: number,
        count?: number
    ): Promise<any[]> {
        const params = new URLSearchParams();
        params.append('searchQuery', searchQuery || '');
        if (start !== undefined) params.append('start', start.toString());
        if (count !== undefined) params.append('count', count.toString());
        
        const queryString = params.toString();
        const url = `${this.baseUrl}room/${ruid}/player/search${queryString ? '?' + queryString : ''}`;
        
        const response = await this.client.get(url);
        return response.data;
    }

    async getPlayerByAuth(ruid: string, auth: string): Promise<any> {
        const response = await this.client.get(`${this.baseUrl}room/${ruid}/player/${auth}`);
        return response.data;
    }

    // ===================================================================
    // Ban List Operations
    // ===================================================================

    async getBanList(ruid: string, start?: number, count?: number): Promise<any[]> {
        const params = new URLSearchParams();
        if (start !== undefined) params.append('start', start.toString());
        if (count !== undefined) params.append('count', count.toString());
        
        const queryString = params.toString();
        const url = `${this.baseUrl}room/${ruid}/banlist${queryString ? '?' + queryString : ''}`;
        
        const response = await this.client.get(url);
        return response.data;
    }

    async getBanByConn(ruid: string, conn: string): Promise<any> {
        const response = await this.client.get(`${this.baseUrl}room/${ruid}/banlist/${conn}`);
        return response.data;
    }

    async createBan(ruid: string, banData: {
        conn: string;
        auth: string;
        reason: string;
        register: number;
        expire: number;
    }): Promise<void> {
        await this.client.post(`${this.baseUrl}room/${ruid}/banlist`, banData);
    }

    async deleteBan(ruid: string, conn: string): Promise<void> {
        await this.client.delete(`${this.baseUrl}room/${ruid}/banlist/${conn}`);
    }

    // ===================================================================
    // RUID List Operations
    // ===================================================================

    async getRuidList(): Promise<any[]> {
        const response = await this.client.get(`${this.baseUrl}ruidlist`);
        return response.data;
    }
}

// Export singleton instance
export const dbClient = new DBClient();
