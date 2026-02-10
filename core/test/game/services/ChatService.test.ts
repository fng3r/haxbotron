/// <reference types="jest" />

import { PlayerRoles } from "../../../game/model/PlayerRole/PlayerRoles";
import { ChatService } from "../../../game/services/ChatService";

describe("ChatService", () => {
    it("detects chat flood when threshold and interval are exceeded", () => {
        const service = new ChatService(3);
        const playerId = 7;

        service.detectChatFlood(playerId, 1000, 3, 3000);
        service.detectChatFlood(playerId, 2000, 3, 3000);
        const result = service.detectChatFlood(playerId, 2500, 3, 3000);

        expect(result).toBe(true);
    });

    it("does not detect chat flood outside interval", () => {
        const service = new ChatService(3);
        const playerId = 7;

        service.detectChatFlood(playerId, 1000, 3, 1000);
        service.detectChatFlood(playerId, 3000, 3, 1000);
        const result = service.detectChatFlood(playerId, 5000, 3, 1000);

        expect(result).toBe(false);
    });

    it("validates message content rules", () => {
        const service = new ChatService(3);

        expect(service.validateMessageContent("ok", 10, false, []).isValid).toBe(true);
        expect(service.validateMessageContent("too-long-message", 5, false, []).reason).toBe("too_long");
        expect(service.validateMessageContent("bad |,| token", 100, false, []).reason).toBe("separator");
        expect(service.validateMessageContent("this is spam", 100, true, ["spam"]).reason).toBe("banned_words");
    });

    it("applies flood mute and returns expire timestamp", () => {
        const service = new ChatService(3);
        const roomPlayer: any = {
            permissions: { mute: false, muteExpire: 0 }
        };

        const muteExpire = service.applyFloodMute(roomPlayer, 1000, 5000);

        expect(roomPlayer.permissions.mute).toBe(true);
        expect(muteExpire).toBe(6000);
    });

    it("allows bypass for high roles only", () => {
        const service = new ChatService(3);

        expect(service.canBypassChatRestrictions({ auth: "a", name: "n", role: PlayerRoles.S_ADM })).toBe(true);
        expect(service.canBypassChatRestrictions({ auth: "a", name: "n", role: PlayerRoles.PLAYER })).toBe(false);
    });
});
