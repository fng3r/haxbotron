/// <reference types="jest" />

import { describe, expect, it } from "@jest/globals";
import { TeamID } from "../../../game/model/GameObject/TeamID";
import { PlayerService } from "../../../game/services/PlayerService";

describe("PlayerService.getPlayersForTeam", () => {
    it("filters players by provided team", () => {
        const service = new PlayerService();
        service.addPlayer({ id: 1, team: TeamID.Red } as any);
        service.addPlayer({ id: 2, team: TeamID.Red } as any);
        service.addPlayer({ id: 3, team: TeamID.Blue } as any);

        const listed = service.getPlayersForTeam(TeamID.Red);

        expect(listed.map((p) => p.id)).toEqual([1, 2]);
    });
});
