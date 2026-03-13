import { DiscordWebhookConfig } from "../../lib/browser.interface";
import { MatchStats } from "./MatchService";

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

    constructor(discordWebhook: DiscordWebhookConfig) {
        this.social = {
            discordWebhook: discordWebhook
        };
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
        if (!replay || !webhook.feed || !webhook.replayUpload || !webhook.replaysWebhookId || !webhook.replaysWebhookToken) {
            return;
        }

        window._feedSocialDiscordWebhook(
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
