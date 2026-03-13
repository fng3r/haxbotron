/// <reference types="jest" />

import { Player } from "../../../game/model/GameObject/Player";
import { PlayerStorage } from "../../../game/model/GameObject/PlayerObject";
import { BanList } from "../../../game/model/PlayerBan/BanList";
import { PlayerRole } from "../../../game/model/PlayerRole/PlayerRole";
import { PlayerRoles } from "../../../game/model/PlayerRole/PlayerRoles";
import { InjectedDBRepository } from "../../../game/repositories/InjectedDBRepository";

function setupMockWindow(ruid: string): void {
    (global as any).window = {
        services: {
            config: {
                getRUID: jest.fn(() => ruid)
            }
        },
        _createPlayerDB: jest.fn(),
        _readPlayerDB: jest.fn(),
        _updatePlayerDB: jest.fn(),
        _deletePlayerDB: jest.fn(),
        _getPlayerRoleDB: jest.fn(),
        _createPlayerRoleDB: jest.fn(),
        _setPlayerRoleDB: jest.fn(),
        _deletePlayerRoleDB: jest.fn(),
        _createBanlistDB: jest.fn(),
        _getAllBansDB: jest.fn(),
        _readBanlistDB: jest.fn(),
        _updateBanlistDB: jest.fn(),
        _deleteBanlistDB: jest.fn(),
    };
}

describe("InjectedDBRepository", () => {
    const ruid = "room-1";
    const samplePlayer: PlayerStorage = {
        auth: "auth-1",
        conn: "conn-1",
        name: "Player One",
        mute: false,
        muteExpire: -1,
        rejoinCount: 0,
        joinDate: 1,
        leftDate: 0,
        nicknames: ["Player One"],
        malActCount: 0,
    };
    const sampleRole: PlayerRole = {
        auth: "auth-1",
        name: "Player One",
        role: PlayerRoles.ADM,
    };
    const sampleBan: BanList = {
        conn: "conn-1",
        auth: "auth-1",
        reason: "spam",
        register: 100,
        expire: 200,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        setupMockWindow(ruid);
    });

    it("upsertPlayer updates when player already exists", async () => {
        const repository = new InjectedDBRepository();
        ((global as any).window._readPlayerDB as jest.Mock).mockResolvedValue(samplePlayer);

        await repository.upsertPlayer(samplePlayer);

        expect((global as any).window._readPlayerDB).toHaveBeenCalledWith(ruid, samplePlayer.auth);
        expect((global as any).window._updatePlayerDB).toHaveBeenCalledWith(ruid, samplePlayer);
        expect((global as any).window._createPlayerDB).not.toHaveBeenCalled();
    });

    it("upsertPlayer creates when player does not exist", async () => {
        const repository = new InjectedDBRepository();
        ((global as any).window._readPlayerDB as jest.Mock).mockResolvedValue(undefined);

        await repository.upsertPlayer(samplePlayer);

        expect((global as any).window._readPlayerDB).toHaveBeenCalledWith(ruid, samplePlayer.auth);
        expect((global as any).window._createPlayerDB).toHaveBeenCalledWith(ruid, samplePlayer);
        expect((global as any).window._updatePlayerDB).not.toHaveBeenCalled();
    });

    it("upsertBan updates when ban already exists", async () => {
        const repository = new InjectedDBRepository();
        ((global as any).window._readBanlistDB as jest.Mock).mockResolvedValue(sampleBan);

        await repository.upsertBan(sampleBan);

        expect((global as any).window._readBanlistDB).toHaveBeenCalledWith(ruid, sampleBan.conn);
        expect((global as any).window._updateBanlistDB).toHaveBeenCalledWith(ruid, sampleBan);
        expect((global as any).window._createBanlistDB).not.toHaveBeenCalled();
    });

    it("upsertBan creates when ban does not exist", async () => {
        const repository = new InjectedDBRepository();
        ((global as any).window._readBanlistDB as jest.Mock).mockResolvedValue(undefined);

        await repository.upsertBan(sampleBan);

        expect((global as any).window._readBanlistDB).toHaveBeenCalledWith(ruid, sampleBan.conn);
        expect((global as any).window._createBanlistDB).toHaveBeenCalledWith(ruid, sampleBan);
        expect((global as any).window._updateBanlistDB).not.toHaveBeenCalled();
    });

    it("delegates role operations to injected functions", async () => {
        const repository = new InjectedDBRepository();

        await repository.createPlayerRole(sampleRole);
        await repository.updatePlayerRole(sampleRole);
        await repository.deletePlayerRole(sampleRole);

        expect((global as any).window._createPlayerRoleDB).toHaveBeenCalledWith(sampleRole);
        expect((global as any).window._setPlayerRoleDB).toHaveBeenCalledWith(sampleRole);
        expect((global as any).window._deletePlayerRoleDB).toHaveBeenCalledWith(sampleRole);
    });

    it("maps player to player storage", () => {
        const repository = new InjectedDBRepository();
        const player = {
            auth: "auth-1",
            conn: "conn-1",
            name: "Player One",
            permissions: {
                mute: true,
                muteExpire: 123,
                malActCount: 2
            },
            entrytime: {
                rejoinCount: 3,
                joinDate: 1000,
                leftDate: 2000
            },
            nicknames: new Set(["Player One", "P1"])
        } as unknown as Player;

        const result = repository.toPlayerStorage(player);

        expect(result).toEqual({
            auth: "auth-1",
            conn: "conn-1",
            name: "Player One",
            mute: true,
            muteExpire: 123,
            rejoinCount: 3,
            joinDate: 1000,
            leftDate: 2000,
            nicknames: ["Player One", "P1"],
            malActCount: 2
        });
    });
});
