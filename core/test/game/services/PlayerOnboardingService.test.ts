/// <reference types="jest" />

import { PlayerRoles } from "../../../game/model/PlayerRole/PlayerRoles";
import { PlayerOnboardingService } from "../../../game/services/PlayerOnboardingService";

describe("PlayerOnboardingService", () => {
    function mockPlayerObject() {
        return {
            id: 1,
            name: "Player One",
            auth: "auth-1",
            conn: "conn-1",
            admin: false,
            team: 0,
            position: null
        };
    }

    function createService() {
        const repository = {
            readPlayer: jest.fn(),
            readPlayerRole: jest.fn(),
            upsertPlayer: jest.fn(),
            toPlayerStorage: jest.fn().mockReturnValue({ auth: "auth-1" })
        };
        return {
            service: new PlayerOnboardingService(repository as any),
            repository
        };
    }

    it("hydrates new player when no persisted data", async () => {
        const { service, repository } = createService();
        repository.readPlayer.mockResolvedValue(undefined);

        const result = await service.hydratePlayer(mockPlayerObject() as any, 1000);

        expect(result.previousName).toBeUndefined();
        expect(result.player.name).toBe("Player One");
        expect(result.player.entrytime.joinDate).toBe(1000);
    });

    it("hydrates returning player and exposes previous name", async () => {
        const { service, repository } = createService();
        repository.readPlayer.mockResolvedValue({
            auth: "auth-1",
            conn: "conn-1",
            name: "Old Name",
            mute: true,
            muteExpire: 1,
            rejoinCount: 3,
            joinDate: 1,
            leftDate: 2,
            nicknames: ["Old Name"],
            malActCount: 1
        });

        const result = await service.hydratePlayer(mockPlayerObject() as any, 1000);

        expect(result.previousName).toBe("Old Name");
        expect(result.player.permissions.mute).toBe(true);
        expect(result.player.entrytime.rejoinCount).toBe(3);
    });

    it("rejects unknown role when whitelist enabled", async () => {
        const { service, repository } = createService();
        repository.readPlayerRole.mockResolvedValue(undefined);

        const result = await service.resolveRole("auth-1", "Player One", true);

        expect(result.shouldRejectUnknown).toBe(true);
        expect(result.role.role).toBe(PlayerRoles.PLAYER);
    });

    it("resolves known role when matching role is found", async () => {
        const { service, repository } = createService();
        repository.readPlayerRole.mockResolvedValue({
            auth: "auth-1",
            name: "Player One",
            role: PlayerRoles.ADM
        });

        const result = await service.resolveRole("auth-1", "Player One", true);

        expect(result.shouldRejectUnknown).toBe(false);
        expect(result.role.role).toBe(PlayerRoles.ADM);
    });
});
