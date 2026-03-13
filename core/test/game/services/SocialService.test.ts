/// <reference types="jest" />

import { SocialService } from "../../../game/services/SocialService";

describe("SocialService.emitReplayWebhook", () => {
    beforeEach(() => {
        (global as any).window = {
            _feedSocialDiscordWebhook: jest.fn()
        };
    });

    it("emits replay webhook when replay upload is configured", () => {
        const service = new SocialService({
            feed: true,
            replayUpload: true,
            replaysWebhookId: "id",
            replaysWebhookToken: "token",
            passwordWebhookId: "",
            passwordWebhookToken: ""
        });
        const replay = new Uint8Array([1, 2, 3]);

        service.emitReplayWebhook("room-1", { startedAt: 1 }, replay);

        expect((global as any).window._feedSocialDiscordWebhook).toHaveBeenCalledTimes(1);
    });

    it("does nothing when replay upload is disabled", () => {
        const service = new SocialService({
            feed: true,
            replayUpload: false,
            replaysWebhookId: "id",
            replaysWebhookToken: "token",
            passwordWebhookId: "",
            passwordWebhookToken: ""
        });
        const replay = new Uint8Array([1, 2, 3]);

        service.emitReplayWebhook("room-1", { startedAt: 1 }, replay);

        expect((global as any).window._feedSocialDiscordWebhook).not.toHaveBeenCalled();
    });
});
