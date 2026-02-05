import { AttachmentBuilder, EmbedBuilder, WebhookClient } from "discord.js";
import moment from "moment";
import { v4 as uuid } from "uuid";
import { getUnixTimestamp } from "../../game/controller/DateTimeUtils";
import { PlayerObject } from "../../game/model/GameObject/PlayerObject";
import { winstonLogger } from "../../winstonLoggerSystem";
import { BrowserHostRoomInitConfig } from "../browser.hostconfig";
import * as dbUtilityInject from "../db.injection";
import { loadStadiumData } from "../stadiumLoader";
import { BrowserManager } from "./BrowserManager";
import { PageEvaluator } from "./PageEvaluator";

export interface RoomInfo {
    roomName: string;
    onlinePlayers: number;
}

export interface RoomDetailInfo extends RoomInfo {
    adminPassword: string;
    link: string;
    _roomConfig: any;
    botSettings: any;
    rules: any;
}

/**
 * Manages room lifecycle: creation, deletion, and information retrieval
 */
export class RoomLifecycleService {
    constructor(
        private browserManager: BrowserManager,
        private pageEvaluator: PageEvaluator
    ) {}

    /**
     * Open a new room
     */
    public async openNewRoom(ruid: string, initConfig: BrowserHostRoomInitConfig): Promise<void> {
        if (this.browserManager.hasPage(ruid)) {
            throw new Error(`[RoomLifecycle] Room '${ruid}' already exists`);
        }

        winstonLogger.info(`[RoomLifecycle] Opening new room: ${ruid}`);
        
        // Apply geolocation override if configured
        if (process.env.TWEAKS_GEOLOCATIONOVERRIDE && JSON.parse(process.env.TWEAKS_GEOLOCATIONOVERRIDE.toLowerCase()) === true) {
            initConfig._config.geo = {
                code: process.env.TWEAKS_GEOLOCATIONOVERRIDE_CODE || "KR",
                lat: parseFloat(process.env.TWEAKS_GEOLOCATIONOVERRIDE_LAT || "37.5665"),
                lon: parseFloat(process.env.TWEAKS_GEOLOCATIONOVERRIDE_LON || "126.978")
            };
        }

        const discordWebhookConfig = {
            feed: JSON.parse(process.env.DISCORD_WEBHOOK_FEED || false.toString()),
            replayUpload: JSON.parse(process.env.DISCORD_WEBHOOK_REPLAY_UPLOAD || false.toString()),
            replaysWebhookId: process.env.DISCORD_REPLAYS_WEBHOOK_ID,
            replaysWebhookToken: process.env.DISCORD_REPLAYS_WEBHOOK_TOKEN,
            passwordWebhookId: process.env.DISCORD_PASSWORD_WEBHOOK_ID,
            passwordWebhookToken: process.env.DISCORD_PASSWORD_WEBHOOK_TOKEN
        };

        // Create page
        const page = await this.browserManager.createPage(ruid);

        // Close first blank page if this is the first room
        const existPages = await this.browserManager.getAllPages();
        if (existPages.length === 2 && this.browserManager.getPageCount() === 1) {
            existPages[0].close();
        }

        // Setup page event listeners
        this.setupPageEventListeners(ruid, page);

        // Navigate to Haxball headless
        await page.goto('https://www.haxball.com/headless', {
            waitUntil: 'networkidle2'
        });

        // Inject configuration via localStorage
        await page.evaluate(
            (initConfigStr: string, defaultMap: string, discordWebhookConfigStr: string) => {
                localStorage.setItem('_initConfig', initConfigStr);
                localStorage.setItem('_defaultMap', defaultMap);
                localStorage.setItem('_discordWebhookConfig', discordWebhookConfigStr);
            },
            JSON.stringify(initConfig),
            loadStadiumData(initConfig.rules.defaultMapName),
            JSON.stringify(discordWebhookConfig)
        );

        // Expose functions to page context
        await this.exposeFunctions(ruid, page);

        // Load bot script
        await page.addScriptTag({ path: './out/bot_bundle.js' });

        // Wait for room link to be created
        await page.waitForFunction(
            () => window.services?.room.getLink() !== undefined && window.services?.room.getLink().length > 0,
            { timeout: 30000 }
        );

        // Emit Socket.IO event
        this.browserManager.emitSocketIOEvent('roomct', { ruid: ruid });
        
        winstonLogger.info(`[RoomLifecycle] Room '${ruid}' opened successfully`);
    }

    /**
     * Close a room
     */
    public async closeRoom(ruid: string): Promise<void> {
        if (!this.browserManager.hasPage(ruid)) {
            throw new Error(`[RoomLifecycle] Room '${ruid}' does not exist`);
        }

        winstonLogger.info(`[RoomLifecycle] Closing room: ${ruid}`);

        // Stop recording before closing
        await this.pageEvaluator.evaluate(ruid, () => {
            window.services?.room.getRoom().stopRecording();
        });

        await this.browserManager.closePage(ruid);
        
        winstonLogger.info(`[RoomLifecycle] Room '${ruid}' closed`);
    }

    /**
     * Check if room exists
     */
    public checkExistRoom(ruid: string): boolean {
        return this.browserManager.hasPage(ruid);
    }

    /**
     * Get list of all existing rooms
     */
    public getExistRoomList(): string[] {
        return this.browserManager.getAllPageIds();
    }

    /**
     * Get number of existing rooms
     */
    public getExistRoomNumber(): number {
        return this.browserManager.getPageCount();
    }

    /**
     * Get room link
     */
    public async getRoomLink(ruid: string): Promise<string> {
        if (!this.browserManager.hasPage(ruid)) {
            throw new Error(`[RoomLifecycle] Room '${ruid}' does not exist`);
        }

        await this.pageEvaluator.waitForCondition(
            ruid,
            () => window.services?.room.getLink() !== undefined && window.services?.room.getLink().length > 0
        );

        return await this.pageEvaluator.evaluate(ruid, () => {
            return window.services!.room.getLink();
        });
    }

    /**
     * Get room info
     */
    public async getRoomInfo(ruid: string): Promise<RoomInfo> {
        if (!this.browserManager.hasPage(ruid)) {
            throw new Error(`[RoomLifecycle] Room '${ruid}' does not exist`);
        }

        return await this.pageEvaluator.evaluate(ruid, () => {
            const services = window.services!;
            return {
                roomName: services.config.getConfig()._config.roomName,
                onlinePlayers: services.player.getPlayerCount()
            };
        });
    }

    /**
     * Get detailed room info
     */
    public async getRoomDetailInfo(ruid: string): Promise<RoomDetailInfo> {
        if (!this.browserManager.hasPage(ruid)) {
            throw new Error(`[RoomLifecycle] Room '${ruid}' does not exist`);
        }

        return await this.pageEvaluator.evaluate(ruid, () => {
            const services = window.services!;
            const config = services.config.getConfig();
            return {
                roomName: config._config.roomName,
                onlinePlayers: services.player.getPlayerCount(),
                adminPassword: services.config.getAdminPassword(),
                link: services.room.getLink(),
                _roomConfig: config._config,
                botSettings: config.settings,
                rules: config.rules
            };
        });
    }

    /**
     * Setup page event listeners
     */
    private setupPageEventListeners(ruid: string, page: any): void {
        // Console logging
        page.on('console', (msg: any) => {
            const text = msg.text();
            switch (msg.type()) {
                case "log":
                case "info":
                    winstonLogger.info(`[${ruid}] ${text}`);
                    break;
                case "error":
                    winstonLogger.error(`[${ruid}] ${text}`);
                    break;
                case "warning":
                    winstonLogger.warn(`[${ruid}] ${text}`);
                    break;
                default:
                    winstonLogger.info(`[${ruid}] ${text}`);
                    break;
            }
        });

        page.on('pageerror', (msg: any) => {
            winstonLogger.error(`[${ruid}] ${msg}`);
        });

        page.on('requestfailed', (msg: any) => {
            winstonLogger.error(`[${ruid}] ${msg.failure().errorText} ${msg.url()}`);
        });

        page.on('close', () => {
            winstonLogger.info(`[RoomLifecycle] Page for room '${ruid}' closed`);
            this.browserManager.emitSocketIOEvent('roomct', { ruid: ruid });
        });

        // Socket.IO events
        page.addListener('_SIO.Log', (event: any) => {
            this.browserManager.emitSocketIOEvent('log', {
                id: uuid(),
                ruid: ruid,
                origin: event.origin,
                type: event.type,
                message: event.message,
                timestamp: event.timestamp
            });
        });

        page.addListener('_SIO.InOut', (event: any) => {
            this.browserManager.emitSocketIOEvent('joinleft', {
                ruid: ruid,
                playerID: event.playerID
            });
        });

        page.addListener('_SIO.StatusChange', (event: any) => {
            this.browserManager.emitSocketIOEvent('statuschange', {
                ruid: ruid,
                playerID: event.playerID
            });
        });

        // Discord webhook
        page.addListener('_SOCIAL.DiscordWebhook', async (event: any) => {
            await this.handleDiscordWebhook(ruid, event);
        });
    }

    /**
     * Expose functions to page context
     */
    private async exposeFunctions(ruid: string, page: any): Promise<void> {
        // Socket.IO functions
        await page.exposeFunction('_emitSIOLogEvent', (origin: string, type: string, message: string) => {
            page.emit('_SIO.Log', { origin, type, message, timestamp: getUnixTimestamp() });
        });

        await page.exposeFunction('_emitSIOPlayerInOutEvent', (playerID: number) => {
            page.emit('_SIO.InOut', { playerID });
        });

        await page.exposeFunction('_emitSIOPlayerStatusChangeEvent', (playerID: number) => {
            page.emit('_SIO.StatusChange', { playerID });
        });

        await page.exposeFunction('_feedSocialDiscordWebhook', (id: string, token: string, type: string, content: any) => {
            page.emit('_SOCIAL.DiscordWebhook', { id, token, type, content });
        });

        // Database functions
        await page.exposeFunction('_createPlayerDB', dbUtilityInject.createPlayerDB);
        await page.exposeFunction('_readPlayerDB', dbUtilityInject.readPlayerDB);
        await page.exposeFunction('_updatePlayerDB', dbUtilityInject.updatePlayerDB);
        await page.exposeFunction('_deletePlayerDB', dbUtilityInject.deletePlayerDB);

        await page.exposeFunction('_getPlayerRoleDB', dbUtilityInject.getPlayerRoleDB);
        await page.exposeFunction('_createPlayerRoleDB', dbUtilityInject.createPlayerRoleDB);
        await page.exposeFunction('_setPlayerRoleDB', dbUtilityInject.setPlayerRoleDB);
        await page.exposeFunction('_deletePlayerRoleDB', dbUtilityInject.deletePlayerRoleDB);

        await page.exposeFunction('_createBanlistDB', dbUtilityInject.createBanlistDB);
        await page.exposeFunction('_getAllBansDB', dbUtilityInject.getAllBansDB);
        await page.exposeFunction('_readBanlistDB', dbUtilityInject.readBanlistDB);
        await page.exposeFunction('_updateBanlistDB', dbUtilityInject.updateBanlistDB);
        await page.exposeFunction('_deleteBanlistDB', dbUtilityInject.deleteBanlistDB);
    }

    /**
     * Handle Discord webhook events
     */
    private async handleDiscordWebhook(ruid: string, event: any): Promise<void> {
        let webhookClient;
        try {
            webhookClient = new WebhookClient({
                id: event.id,
                token: event.token
            });
        } catch (e) {
            winstonLogger.error(`[RoomLifecycle] Failed to create Discord webhook client: ${e}`);
            return;
        }

        switch (event.type as string) {
            case "replay":
                await this.handleDiscordReplayWebhook(webhookClient, event.content);
                break;
            case "password":
                await this.handleDiscordPasswordWebhook(webhookClient, event.content);
                break;
        }
    }

    /**
     * Handle Discord replay webhook
     */
    private async handleDiscordReplayWebhook(webhookClient: WebhookClient, content: any): Promise<void> {
        const { roomId, matchStats } = content;
        const matchDuration = moment.duration(matchStats.scores.time, 'seconds');
        const matchDurationString = `${matchDuration.minutes().toString().padStart(2, '0')}:${matchDuration.seconds().toString().padStart(2, '0')}`;
        const matchScoreString = `🔴 Red Team ${matchStats.scores.red}:${matchStats.scores.blue} Blue Team 🔵\n​`;
        const matchStartString = moment(matchStats.startedAt).format('DD.MM.YY HH:mm:ss');

        const bufferData = Buffer.from(JSON.parse(content.data));
        const replayDateString = moment(matchStats.startedAt).format('DD-MM-YYTHH-mm-ss');
        const filename = `${roomId}_${replayDateString}.hbr2`;
        const attachment = new AttachmentBuilder(bufferData, { name: filename });

        const embed = new EmbedBuilder()
            .setColor('White')
            .setAuthor({ name: 'CIS-HAXBALL', iconURL: 'https://cis-haxball.ru/static/img/logo_try.png', url: 'https://cis-haxball.ru/' })
            .setThumbnail('https://cis-haxball.ru/static/img/logo_try.png')
            .setTitle(`${roomId} | ${matchStartString}`)
            .setDescription(`[${matchDurationString}]  ${matchScoreString}\n`)
            .addFields([
                {
                    name: '🔴\t\tRed Team\t\t\t\n-----------------------',
                    value: matchStats.startingLineup.red.map((p: PlayerObject) => `> **${p.name}**`).join('\n') || ' ',
                    inline: true
                },
                {
                    name: '🔵\t\tBlue Team\t\t\t\n-----------------------',
                    value: matchStats.startingLineup.blue.map((p: PlayerObject) => `> **${p.name}**`).join('\n') || ' ',
                    inline: true
                },
                {
                    name: ' ',
                    value: '-------------------------------------------------'
                }
            ])
            .setFooter({ text: `Replay: ${filename}` })
            .setTimestamp();

        try {
            await webhookClient.send({ embeds: [embed] });
            await webhookClient.send({ files: [attachment] });
        } catch (error) {
            winstonLogger.error(`[RoomLifecycle] Error sending replay to Discord webhook: ${error}`);
        }
    }

    /**
     * Handle Discord password webhook
     */
    private async handleDiscordPasswordWebhook(webhookClient: WebhookClient, content: any): Promise<void> {
        try {
            await webhookClient.send(content.message);
        } catch (error) {
            winstonLogger.error(`[RoomLifecycle] Error sending password to Discord webhook: ${error}`);
        }
    }
}
