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

    constructor(discordWebhook: any) {
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
}
