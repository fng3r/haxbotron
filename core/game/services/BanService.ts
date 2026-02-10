import { BanList } from "../model/PlayerBan/BanList";
import { getInjectedDBRepository, InjectedDBRepository } from "../repositories/InjectedDBRepository";

export type JoinBanStatus = "not_banned" | "permanent_ban" | "temporary_ban_active" | "temporary_ban_expired";

export interface JoinBanCheckResult {
    status: JoinBanStatus;
    ban?: BanList;
}

/**
 * Centralizes ban-related domain behavior for in-page runtime.
 */
export class BanService {
    constructor(private readonly repository: InjectedDBRepository = getInjectedDBRepository()) {}

    public createPermanentBan(conn: string, auth: string, reason: string, registerTimestamp: number): BanList {
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
    ): BanList {
        return {
            conn,
            auth,
            reason,
            register: registerTimestamp,
            expire: registerTimestamp + durationMs
        };
    }

    public async upsertBan(ban: BanList): Promise<void> {
        await this.repository.upsertBan(ban);
    }

    public async getBan(conn: string): Promise<BanList | undefined> {
        return await this.repository.readBan(conn);
    }

    public async getAllBans(): Promise<BanList[] | undefined> {
        return await this.repository.readAllBans();
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
