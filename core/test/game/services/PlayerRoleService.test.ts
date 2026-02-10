/// <reference types="jest" />

import { describe, expect, it } from "@jest/globals";
import { PlayerRoles } from "../../../game/model/PlayerRole/PlayerRoles";
import { PlayerRoleService } from "../../../game/services/PlayerRoleService";

describe("PlayerRoleService admin policy helpers", () => {
    it("restores admin when lower privilege user changes higher privilege user", () => {
        const service = new PlayerRoleService();
        service.setRole(1, { auth: "a1", name: "mod", role: PlayerRoles.ADM });
        service.setRole(2, { auth: "a2", name: "owner", role: PlayerRoles.CO_HOST });

        expect(service.shouldRestoreAdminAfterRemoval(2, 1)).toBe(true);
    });

    it("does not restore admin when actor has enough privilege", () => {
        const service = new PlayerRoleService();
        service.setRole(1, { auth: "a1", name: "owner", role: PlayerRoles.CO_HOST });
        service.setRole(2, { auth: "a2", name: "mod", role: PlayerRoles.ADM });

        expect(service.shouldRestoreAdminAfterRemoval(2, 1)).toBe(false);
    });

    it("forces admin removal for BAD role", () => {
        const service = new PlayerRoleService();
        service.setRole(10, { auth: "a10", name: "bad", role: PlayerRoles.BAD });

        expect(service.shouldForceRemoveAdmin(10)).toBe(true);
        expect(service.shouldForceRemoveAdmin(999)).toBe(false);
    });
});
