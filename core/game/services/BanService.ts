import { BanEntry } from "../model/PlayerBan/BanEntry";
import { RoomDbRepository } from "../runtime/RoomDbRepository";

export type JoinBanStatus = "not_banned" | "permanent_ban" | "temporary_ban_active" | "temporary_ban_expired";

export interface JoinBanCheckResult {
    status: JoinBanStatus;
    ban?: BanEntry;
}

export interface BanDisplayEntry {
    playerName: string;
    expire: number;
}

/**
 * Centralizes ban-related domain behavior for in-page runtime.
 */
export class BanService {
    constructor(private readonly repository: RoomDbRepository) {}

    public createPermanentBan(conn: string, auth: string, reason: string, registerTimestamp: number): BanEntry {
        return {
            conn,
            auth,
            reason,
            register: registerTimestamp,
            expire: -1
        };
    }

    public createTemporaryBan(
        conn: string,
        auth: string,
        reason: string,
        registerTimestamp: number,
        durationMs: number
    ): BanEntry {
        return {
            conn,
            auth,
            reason,
            register: registerTimestamp,
            expire: registerTimestamp + durationMs
        };
    }

    public async upsertBan(ban: BanEntry): Promise<void> {
        await this.repository.upsertBan(ban);
    }

    public async getBan(conn: string): Promise<BanEntry | undefined> {
        return await this.repository.readBan(conn);
    }

    public async getAllBans(): Promise<BanEntry[] | undefined> {
        return await this.repository.readAllBans();
    }

    public async getBanDisplayEntries(): Promise<BanDisplayEntry[] | undefined> {
        const bans = await this.getAllBans();
        if (!bans) {
            return undefined;
        }

        const entries: BanDisplayEntry[] = [];
        for (const ban of bans) {
            const player = await this.repository.readPlayer(ban.auth);
            entries.push({
                playerName: player?.name || ban.auth,
                expire: ban.expire
            });
        }
        return entries;
    }

    public async removeBan(conn: string): Promise<void> {
        await this.repository.deleteBan(conn);
    }

    public async evaluateJoinBan(conn: string, nowTimestamp: number): Promise<JoinBanCheckResult> {
        const ban = await this.repository.readBan(conn);
        if (!ban) {
            return { status: "not_banned" };
        }

        if (ban.expire === -1) {
            return { status: "permanent_ban", ban };
        }

        if (ban.expire > nowTimestamp) {
            return { status: "temporary_ban_active", ban };
        }

        await this.repository.deleteBan(conn);
        return { status: "temporary_ban_expired", ban };
    }
}
