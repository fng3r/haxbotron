/// <reference types="jest" />

import { SocialService } from "../../../game/services/SocialService";
import { DiscordWebhookService } from "../../../lib/integrations/DiscordWebhookService";

describe("SocialService.sendReplayWebhook", () => {
    it("sends replay webhook when replay upload is configured", () => {
        const webhookService = {
            sendReplay: jest.fn()
        } as unknown as DiscordWebhookService;
        const service = new SocialService({
            feed: true,
            replayUpload: true,
            replaysWebhookId: "id",
            replaysWebhookToken: "token",
            passwordWebhookId: "",
            passwordWebhookToken: ""
        }, webhookService);
        const replay = new Uint8Array([1, 2, 3]);

        service.sendReplayWebhook("room-1", {
            startedAt: 1,
            startingLineup: { red: [], blue: [] },
            scores: { red: 0, blue: 0, time: 0 },
        }, replay);

        expect((webhookService.sendReplay as jest.Mock)).toHaveBeenCalledTimes(1);
    });

    it("does nothing when replay upload is disabled", () => {
        const webhookService = {
            sendReplay: jest.fn()
        } as unknown as DiscordWebhookService;
        const service = new SocialService({
            feed: true,
            replayUpload: false,
            replaysWebhookId: "id",
            replaysWebhookToken: "token",
            passwordWebhookId: "",
            passwordWebhookToken: ""
        }, webhookService);
        const replay = new Uint8Array([1, 2, 3]);

        service.sendReplayWebhook("room-1", {
            startedAt: 1,
            startingLineup: { red: [], blue: [] },
            scores: { red: 0, blue: 0, time: 0 },
        }, replay);

        expect((webhookService.sendReplay as jest.Mock)).not.toHaveBeenCalled();
    });
});

describe("SocialService.sendPasswordWebhook", () => {
    it("sends password webhook when feed credentials are configured", () => {
        const webhookService = {
            sendPassword: jest.fn()
        } as unknown as DiscordWebhookService;
        const service = new SocialService({
            feed: true,
            replayUpload: false,
            replaysWebhookId: "",
            replaysWebhookToken: "",
            passwordWebhookId: "id",
            passwordWebhookToken: "token"
        }, webhookService);

        service.sendPasswordWebhook("room-1", "secret");

        expect((webhookService.sendPassword as jest.Mock)).toHaveBeenCalledTimes(1);
        expect((webhookService.sendPassword as jest.Mock)).toHaveBeenCalledWith({
            webhookId: "id",
            webhookToken: "token",
        }, {
            roomId: "room-1",
            password: "secret",
        });
    });

    it("does nothing when feed is disabled", () => {
        const webhookService = {
            sendPassword: jest.fn()
        } as unknown as DiscordWebhookService;
        const service = new SocialService({
            feed: false,
            replayUpload: false,
            replaysWebhookId: "",
            replaysWebhookToken: "",
            passwordWebhookId: "id",
            passwordWebhookToken: "token"
        }, webhookService);

        service.sendPasswordWebhook("room-1", "secret");

        expect((webhookService.sendPassword as jest.Mock)).not.toHaveBeenCalled();
    });
});
