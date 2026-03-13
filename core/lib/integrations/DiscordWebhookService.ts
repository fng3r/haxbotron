import { AttachmentBuilder, EmbedBuilder, WebhookClient } from "discord.js";
import moment from "moment";
import { winstonLogger } from "../../winstonLoggerSystem";

type ReplayContent = {
    type: "replay";
    roomId: string;
    matchStats: {
        scores: { time: number; red: number; blue: number };
        startedAt: number;
        startingLineup: { red: PlayerObject[]; blue: PlayerObject[] };
    };
    data: string;
};

type PasswordContent = {
    type: "password";
    roomId: string;
    password: string;
};

export type DiscordWebhookContent = ReplayContent | PasswordContent;

export class DiscordWebhookService {
    public async sendReplay(webhookId: string, webhookToken: string, content: ReplayContent): Promise<void> {
        const webhookClient = this.createWebhookClient(webhookId, webhookToken);
        if (!webhookClient) return;

        const { roomId, matchStats } = content;
        const matchDuration = moment.duration(matchStats.scores.time, "seconds");
        const matchDurationString = `${matchDuration.minutes().toString().padStart(2, "0")}:${matchDuration.seconds().toString().padStart(2, "0")}`;
        const matchScoreString = `🔴 Red Team ${matchStats.scores.red}:${matchStats.scores.blue} Blue Team 🔵\n​`;
        const matchStartString = moment(matchStats.startedAt).format("DD.MM.YY HH:mm:ss");

        const bufferData = Buffer.from(JSON.parse(content.data));
        const replayDateString = moment(matchStats.startedAt).format("DD-MM-YYTHH-mm-ss");
        const filename = `${roomId}_${replayDateString}.hbr2`;
        const attachment = new AttachmentBuilder(bufferData, { name: filename });

        const embed = new EmbedBuilder()
            .setColor("White")
            .setAuthor({ name: "CIS-HAXBALL", iconURL: "https://cis-haxball.ru/static/img/logo_try.png", url: "https://cis-haxball.ru/" })
            .setThumbnail("https://cis-haxball.ru/static/img/logo_try.png")
            .setTitle(`${roomId} | ${matchStartString}`)
            .setDescription(`[${matchDurationString}]  ${matchScoreString}\n`)
            .addFields([
                {
                    name: "🔴\t\tRed Team\t\t\t\n-----------------------",
                    value: matchStats.startingLineup.red.map((p: PlayerObject) => `> **${p.name}**`).join("\n") || " ",
                    inline: true,
                },
                {
                    name: "🔵\t\tBlue Team\t\t\t\n-----------------------",
                    value: matchStats.startingLineup.blue.map((p: PlayerObject) => `> **${p.name}**`).join("\n") || " ",
                    inline: true,
                },
                {
                    name: " ",
                    value: "-------------------------------------------------",
                },
            ])
            .setFooter({ text: `Replay: ${filename}` })
            .setTimestamp();

        try {
            await webhookClient.send({ embeds: [embed] });
            await webhookClient.send({ files: [attachment] });
        } catch (error) {
            winstonLogger.error(`[Discord] Error sending replay to webhook: ${error}`);
        }
    }

    public async sendPassword(webhookId: string, webhookToken: string, content: PasswordContent): Promise<void> {
        const webhookClient = this.createWebhookClient(webhookId, webhookToken);
        if (!webhookClient) return;

        const { roomId, password } = content;
        const message = `🔒 ${roomId} Admin password was updated. Current admin password is '${password}'`;

        try {
            await webhookClient.send(message);
        } catch (error) {
            winstonLogger.error(`[Discord] Error sending password to webhook: ${error}`);
        }
    }

    private createWebhookClient(id: string, token: string): WebhookClient | null {
        try {
            return new WebhookClient({ id, token });
        } catch (e) {
            winstonLogger.error(`[Discord] Failed to create webhook client: ${e}`);
            return null;
        }
    }
}
