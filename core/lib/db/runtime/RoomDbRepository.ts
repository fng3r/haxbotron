import { Player } from "../../../game/model/GameObject/Player";
import { PlayerStorage } from "../../../game/model/GameObject/PlayerState";
import { BanEntry } from "../../../game/model/PlayerBan/BanEntry";
import { PlayerRole } from "../../../game/model/PlayerRole/PlayerRole";
import { RoomDbAdapter } from "../adapters/RoomDbAdapter";

export class RoomDbRepository {
    constructor(
        private readonly ruid: string,
        private readonly adapter: RoomDbAdapter = new RoomDbAdapter()
    ) {}

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
            malActCount: player.permissions.malActCount,
        };
    }

    public async createPlayer(player: PlayerStorage): Promise<void> {
        await this.adapter.createPlayer(this.ruid, player);
    }

    public async readPlayer(auth: string): Promise<PlayerStorage | undefined> {
        return await this.adapter.readPlayer(this.ruid, auth);
    }

    public async updatePlayer(player: PlayerStorage): Promise<void> {
        await this.adapter.updatePlayer(this.ruid, player);
    }

    public async deletePlayer(auth: string): Promise<void> {
        await this.adapter.deletePlayer(this.ruid, auth);
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
        await this.adapter.createPlayerRole(playerRole);
    }

    public async readPlayerRole(auth: string): Promise<PlayerRole | undefined> {
        return await this.adapter.getPlayerRole(auth);
    }

    public async updatePlayerRole(playerRole: PlayerRole): Promise<void> {
        await this.adapter.setPlayerRole(playerRole);
    }

    public async deletePlayerRole(playerRole: PlayerRole): Promise<void> {
        await this.adapter.deletePlayerRole(playerRole);
    }

    public async createBan(banList: BanEntry): Promise<void> {
        await this.adapter.createBan(this.ruid, banList);
    }

    public async readBan(conn: string): Promise<BanEntry | undefined> {
        return await this.adapter.readBan(this.ruid, conn);
    }

    public async readAllBans(): Promise<BanEntry[] | undefined> {
        return await this.adapter.getAllBans(this.ruid);
    }

    public async updateBan(banList: BanEntry): Promise<void> {
        await this.adapter.updateBan(this.ruid, banList);
    }

    public async deleteBan(conn: string): Promise<void> {
        await this.adapter.deleteBan(this.ruid, conn);
    }

    public async upsertBan(banList: BanEntry): Promise<void> {
        const existing = await this.readBan(banList.conn);
        if (existing !== undefined) {
            await this.updateBan(banList);
            return;
        }
        await this.createBan(banList);
    }
}
