/// <reference types="jest" />

import { Player } from "../../../game/model/GameObject/Player";
import { PlayerStorage } from "../../../game/model/GameObject/PlayerState";
import { BanEntry } from "../../../game/model/PlayerBan/BanEntry";
import { PlayerRole } from "../../../game/model/PlayerRole/PlayerRole";
import { PlayerRoles } from "../../../game/model/PlayerRole/PlayerRoles";
import { RoomDbRepository } from "../../../lib/db/runtime/RoomDbRepository";

function createMockAdapter() {
    return {
        createPlayer: jest.fn(),
        readPlayer: jest.fn(),
        updatePlayer: jest.fn(),
        deletePlayer: jest.fn(),
        getPlayerRole: jest.fn(),
        createPlayerRole: jest.fn(),
        setPlayerRole: jest.fn(),
        deletePlayerRole: jest.fn(),
        createBan: jest.fn(),
        getAllBans: jest.fn(),
        readBan: jest.fn(),
        updateBan: jest.fn(),
        deleteBan: jest.fn(),
    };
}

describe("RoomDbRepository", () => {
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
    const sampleBan: BanEntry = {
        conn: "conn-1",
        auth: "auth-1",
        reason: "spam",
        register: 100,
        expire: 200,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("upsertPlayer updates when player already exists", async () => {
        const adapter = createMockAdapter();
        const repository = new RoomDbRepository(ruid, adapter as any);
        adapter.readPlayer.mockResolvedValue(samplePlayer);

        await repository.upsertPlayer(samplePlayer);

        expect(adapter.readPlayer).toHaveBeenCalledWith(ruid, samplePlayer.auth);
        expect(adapter.updatePlayer).toHaveBeenCalledWith(ruid, samplePlayer);
        expect(adapter.createPlayer).not.toHaveBeenCalled();
    });

    it("upsertPlayer creates when player does not exist", async () => {
        const adapter = createMockAdapter();
        const repository = new RoomDbRepository(ruid, adapter as any);
        adapter.readPlayer.mockResolvedValue(undefined);

        await repository.upsertPlayer(samplePlayer);

        expect(adapter.readPlayer).toHaveBeenCalledWith(ruid, samplePlayer.auth);
        expect(adapter.createPlayer).toHaveBeenCalledWith(ruid, samplePlayer);
        expect(adapter.updatePlayer).not.toHaveBeenCalled();
    });

    it("upsertBan updates when ban already exists", async () => {
        const adapter = createMockAdapter();
        const repository = new RoomDbRepository(ruid, adapter as any);
        adapter.readBan.mockResolvedValue(sampleBan);

        await repository.upsertBan(sampleBan);

        expect(adapter.readBan).toHaveBeenCalledWith(ruid, sampleBan.conn);
        expect(adapter.updateBan).toHaveBeenCalledWith(ruid, sampleBan);
        expect(adapter.createBan).not.toHaveBeenCalled();
    });

    it("upsertBan creates when ban does not exist", async () => {
        const adapter = createMockAdapter();
        const repository = new RoomDbRepository(ruid, adapter as any);
        adapter.readBan.mockResolvedValue(undefined);

        await repository.upsertBan(sampleBan);

        expect(adapter.readBan).toHaveBeenCalledWith(ruid, sampleBan.conn);
        expect(adapter.createBan).toHaveBeenCalledWith(ruid, sampleBan);
        expect(adapter.updateBan).not.toHaveBeenCalled();
    });

    it("delegates role operations to the room DB adapter", async () => {
        const adapter = createMockAdapter();
        const repository = new RoomDbRepository(ruid, adapter as any);

        await repository.createPlayerRole(sampleRole);
        await repository.updatePlayerRole(sampleRole);
        await repository.deletePlayerRole(sampleRole);

        expect(adapter.createPlayerRole).toHaveBeenCalledWith(sampleRole);
        expect(adapter.setPlayerRole).toHaveBeenCalledWith(sampleRole);
        expect(adapter.deletePlayerRole).toHaveBeenCalledWith(sampleRole);
    });

    it("maps player to player storage", () => {
        const repository = new RoomDbRepository(ruid, createMockAdapter() as any);
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
