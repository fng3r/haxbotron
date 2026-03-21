import { PlayerRoles } from "../../game/model/PlayerRole/PlayerRoles";
import { DbApiGateway } from "../../lib/db/DbApiGateway";

describe("DbApiGateway", () => {
    function createGateway() {
        const client = {
            get: jest.fn(),
            post: jest.fn(),
            put: jest.fn(),
            delete: jest.fn()
        };
        const baseUrl = "http://127.0.0.1:12100/api/v1/";
        const gateway = new DbApiGateway(baseUrl, client as any);
        return { gateway, client };
    }

    it("builds player search URL with query params", async () => {
        const { gateway, client } = createGateway();
        client.get.mockResolvedValue({ data: [] });

        await gateway.searchPlayers("room-1", "abc", 10, 25);

        expect(client.get).toHaveBeenCalledWith(
            "http://127.0.0.1:12100/api/v1/room/room-1/player/search?searchQuery=abc&start=10&count=25"
        );
    });

    it("builds player role delete URL with encoded query param", async () => {
        const { gateway, client } = createGateway();
        client.delete.mockResolvedValue({ data: null });

        await gateway.deletePlayerRole("auth-1", "name with spaces");

        expect(client.delete).toHaveBeenCalledWith(
            "http://127.0.0.1:12100/api/v1/player-roles/auth-1?name=name+with+spaces"
        );
    });

    it("builds query-payload player-role update URL used by the room runtime", async () => {
        const { gateway, client } = createGateway();
        client.put.mockResolvedValue({ data: null });

        await gateway.updatePlayerRoleQueryPayload({
            auth: "auth-1",
            name: "Player One",
            role: PlayerRoles.ADM
        });

        expect(client.put).toHaveBeenCalledWith(
            "http://127.0.0.1:12100/api/v1/player-roles/auth-1?name=Player+One&role=adm"
        );
    });

    it("routes ban update through canonical endpoint", async () => {
        const { gateway, client } = createGateway();
        client.put.mockResolvedValue({ data: null });
        const ban = {
            conn: "conn-1",
            auth: "auth-1",
            reason: "spam",
            register: 1,
            expire: 2
        };

        await gateway.updateBan("room-1", ban);

        expect(client.put).toHaveBeenCalledWith(
            "http://127.0.0.1:12100/api/v1/room/room-1/banlist/conn-1",
            ban
        );
    });
});
