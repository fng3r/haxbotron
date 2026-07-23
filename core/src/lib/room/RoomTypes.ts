export type DiscordWebhookCredentials = {
    webhookId: string;
    webhookToken: string;
};

export type DiscordWebhookConfig = {
    feed: boolean;
    passwordWebhookId: string;
    passwordWebhookToken: string;
    replaysWebhookId: string;
    replaysWebhookToken: string;
    replayUpload: boolean;
};
