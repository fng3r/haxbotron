import { ApiDbAdapter } from "../../../lib/db/adapters/ApiDbAdapter";
import { RoomDbApiAdapter } from "../../../lib/db/adapters/RoomDbApiAdapter";

describe("DB adapters", () => {
    it("ApiDbAdapter returns data from gateway responses", async () => {
        const gateway = {
            searchPlayerRoles: jest.fn().mockResolvedValue({ data: [{ auth: "a1" }] }),
            getRuidList: jest.fn().mockResolvedValue({ data: ["r1"] })
        };

        const adapter = new ApiDbAdapter(gateway as any);
        const roles = await adapter.searchPlayerRoles("x", 0, 10);
        const ruids = await adapter.getRuidList();

        expect(roles).toEqual([{ auth: "a1" }]);
        expect(ruids).toEqual(["r1"]);
        expect(gateway.searchPlayerRoles).toHaveBeenCalledWith("x", 0, 10);
        expect(gateway.getRuidList).toHaveBeenCalled();
    });

    it("RoomDbApiAdapter swallows 404 on read and returns undefined", async () => {
        const gateway = {
            readPlayer: jest.fn().mockRejectedValue({ response: { status: 404 } })
        };
        const logger = {
            info: jest.fn(),
            error: jest.fn()
        };

        const adapter = new RoomDbApiAdapter(gateway as any, logger);
        const player = await adapter.readPlayer("room-1", "auth-1");

        expect(player).toBeUndefined();
        expect(logger.info).toHaveBeenCalled();
        expect(logger.error).not.toHaveBeenCalled();
    });

    it("RoomDbApiAdapter logs and swallows non-404 read errors", async () => {
        const gateway = {
            readBan: jest.fn().mockRejectedValue(new Error("network issue"))
        };
        const logger = {
            info: jest.fn(),
            error: jest.fn()
        };

        const adapter = new RoomDbApiAdapter(gateway as any, logger);
        const ban = await adapter.readBan("room-1", "conn-1");

        expect(ban).toBeUndefined();
        expect(logger.error).toHaveBeenCalled();
    });
});
