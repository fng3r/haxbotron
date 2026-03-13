/// <reference types="jest" />

import { describe, expect, it, jest } from "@jest/globals";
import { BanService } from "../../../game/services/BanService";

describe("BanService", () => {
    const sampleBan = {
        conn: "conn-1",
        auth: "auth-1",
        reason: "spam",
        register: 100,
        expire: 200
    };

    function createService() {
        const repository: any = {
            readBan: jest.fn(),
            deleteBan: jest.fn(),
            upsertBan: jest.fn(),
            readAllBans: jest.fn(),
            readPlayer: jest.fn()
        };

        return {
            service: new BanService(repository as any),
            repository
        };
    }

    it("returns not_banned when no ban exists", async () => {
        const { service, repository } = createService();
        repository.readBan.mockResolvedValue(undefined);

        const result = await service.evaluateJoinBan("conn-1", 150);

        expect(result).toEqual({ status: "not_banned" });
        expect(repository.deleteBan).not.toHaveBeenCalled();
    });

    it("returns permanent_ban for permanent entries", async () => {
        const { service, repository } = createService();
        repository.readBan.mockResolvedValue({ ...sampleBan, expire: -1 });

        const result = await service.evaluateJoinBan("conn-1", 150);

        expect(result.status).toBe("permanent_ban");
        expect(result.ban?.expire).toBe(-1);
        expect(repository.deleteBan).not.toHaveBeenCalled();
    });

    it("returns temporary_ban_active for unexpired temporary bans", async () => {
        const { service, repository } = createService();
        repository.readBan.mockResolvedValue({ ...sampleBan, expire: 1000 });

        const result = await service.evaluateJoinBan("conn-1", 500);

        expect(result.status).toBe("temporary_ban_active");
        expect(repository.deleteBan).not.toHaveBeenCalled();
    });

    it("returns temporary_ban_expired and removes expired ban", async () => {
        const { service, repository } = createService();
        repository.readBan.mockResolvedValue({ ...sampleBan, expire: 1000 });

        const result = await service.evaluateJoinBan("conn-1", 1500);

        expect(result.status).toBe("temporary_ban_expired");
        expect(repository.deleteBan).toHaveBeenCalledWith("conn-1");
    });

    it("creates fixed-term bans from duration", () => {
        const { service } = createService();

        const ban = service.createTemporaryBan("conn-1", "auth-1", "reason", 1000, 5000);

        expect(ban).toEqual({
            conn: "conn-1",
            auth: "auth-1",
            reason: "reason",
            register: 1000,
            expire: 6000
        });
    });

    it("builds display entries with player names", async () => {
        const { service, repository } = createService();
        repository.readAllBans.mockResolvedValue([
            { ...sampleBan, auth: "auth-1", expire: 1000 }
        ]);
        repository.readPlayer.mockResolvedValue({ name: "John" });

        const entries = await service.getBanDisplayEntries();

        expect(entries).toEqual([{ playerName: "John", expire: 1000 }]);
    });

    it("falls back to auth when player record missing", async () => {
        const { service, repository } = createService();
        repository.readAllBans.mockResolvedValue([
            { ...sampleBan, auth: "auth-missing", expire: -1 }
        ]);
        repository.readPlayer.mockResolvedValue(undefined);

        const entries = await service.getBanDisplayEntries();

        expect(entries).toEqual([{ playerName: "auth-missing", expire: -1 }]);
    });
});
