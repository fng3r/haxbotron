import { DiscordWebhookConfig } from "../../lib/room.interface";
import { MatchStats } from "./MatchService";
import { DiscordWebhookService } from "../../lib/integrations/DiscordWebhookService";

/**
 * Service for managing social integrations (Discord webhooks, etc.)
 */
export class SocialService {
    private social: {
        discordWebhook: {
            feed: boolean;
            passwordWebhookId: string;
            passwordWebhookToken: string;
            replaysWebhookId: string;
            replaysWebhookToken: string;
            replayUpload: boolean;
        };
    };
    private readonly discordWebhookService?: DiscordWebhookService;

    constructor(discordWebhook: DiscordWebhookConfig, discordWebhookService?: DiscordWebhookService) {
        this.social = {
            discordWebhook: discordWebhook
        };
        this.discordWebhookService = discordWebhookService;
    }

    public getDiscordWebhook() {
        return this.social.discordWebhook;
    }

    public getSocialConfig() {
        return this.social;
    }

    public updateDiscordWebhook(webhook: Partial<typeof this.social.discordWebhook>): void {
        this.social.discordWebhook = { ...this.social.discordWebhook, ...webhook };
    }

    public emitReplayWebhook(roomId: string, matchStats: MatchStats, replay: Uint8Array | null): void {
        const webhook = this.social.discordWebhook;
        if (
            !replay ||
            !this.discordWebhookService ||
            !webhook.feed ||
            !webhook.replayUpload ||
            !webhook.replaysWebhookId ||
            !webhook.replaysWebhookToken
        ) {
            return;
        }

        void this.discordWebhookService.sendReplay(
            webhook.replaysWebhookId,
            webhook.replaysWebhookToken,
            {
                type: "replay",
                roomId: roomId,
                matchStats: matchStats,
                data: JSON.stringify(Array.from(replay))
            }
        );
    }
}
