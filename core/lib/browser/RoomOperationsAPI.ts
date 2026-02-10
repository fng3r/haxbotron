import { Player } from "../../game/model/GameObject/Player";
import { TeamID } from "../../game/model/GameObject/TeamID";
import { BrowserHostRoomInitConfig } from "../browser.hostconfig";
import { DiscordWebhookConfig } from "../browser.interface";
import { PageEvaluator } from "./PageEvaluator";
import { RoomDetailInfo, RoomInfo, RoomLifecycleService } from "./RoomLifecycleService";

/**
 * Public API facade for room operations.
 * Maintains backward compatibility with HeadlessBrowser interface.
 */
export class RoomOperationsAPI {
    constructor(
        private roomLifecycle: RoomLifecycleService,
        private pageEvaluator: PageEvaluator
    ) {}

    // ===================================================================
    // Room Lifecycle Operations
    // ===================================================================

    public async openNewRoom(ruid: string, config: BrowserHostRoomInitConfig): Promise<void> {
        return await this.roomLifecycle.openNewRoom(ruid, config);
    }

    public async closeRoom(ruid: string): Promise<void> {
        return await this.roomLifecycle.closeRoom(ruid);
    }

    public checkExistRoom(ruid: string): boolean {
        return this.roomLifecycle.checkExistRoom(ruid);
    }

    public getExistRoomList(): string[] {
        return this.roomLifecycle.getExistRoomList();
    }

    public getExistRoomNumber(): number {
        return this.roomLifecycle.getExistRoomNumber();
    }

    public async getRoomLink(ruid: string): Promise<string> {
        return await this.roomLifecycle.getRoomLink(ruid);
    }

    public async getRoomInfo(ruid: string): Promise<RoomInfo> {
        return await this.roomLifecycle.getRoomInfo(ruid);
    }

    public async getRoomDetailInfo(ruid: string): Promise<RoomDetailInfo> {
        return await this.roomLifecycle.getRoomDetailInfo(ruid);
    }

    // ===================================================================
    // Player Operations (via in-browser ServiceContainer)
    // ===================================================================

    public async getOnlinePlayersIDList(ruid: string): Promise<number[]> {
        return await this.pageEvaluator.evaluate(ruid, () => {
            return Array.from(window.services!.player.getPlayerList().keys());
        });
    }

    public async checkOnlinePlayer(ruid: string, id: number): Promise<boolean> {
        return await this.pageEvaluator.evaluateWithArgs(
            ruid,
            (id: number) => {
                return window.services!.player.getPlayerList().has(id);
            },
            id
        );
    }

    public async getPlayerInfo(ruid: string, id: number): Promise<Player | undefined> {
        return await this.pageEvaluator.evaluateWithArgs(
            ruid,
            (id: number) => {
                const playerList = window.services!.player.getPlayerList();
                if (playerList.has(id)) {
                    return playerList.get(id);
                } else {
                    return undefined;
                }
            },
            id
        );
    }

    public async banPlayerTemporarily(
        ruid: string,
        id: number,
        ban: boolean,
        reason: string,
        seconds: number
    ): Promise<void> {
        await this.pageEvaluator.evaluateWithArgs(
            ruid,
            async (id: number, ban: boolean, reason: string, seconds: number) => {
                const services = window.services!;
                const playerList = services.player.getPlayerList();
                const room = services.room.getRoom();

                if (playerList.has(id)) {
                    const player = playerList.get(id)!;
                    const banItem = services.ban.createTemporaryBan(
                        player.conn,
                        player.auth,
                        reason,
                        Math.floor(Date.now()),
                        seconds * 1000
                    );
                    await services.ban.upsertBan(banItem);
                    room.kickPlayer(id, reason, ban);
                    services.logger.i('system', `[Kick] #${id} has been ${ban ? 'banned' : 'kicked'} by operator. (duration: ${seconds}secs, reason: ${reason})`);
                }
            },
            id,
            ban,
            reason,
            seconds
        );
    }

    // ===================================================================
    // Chat Operations (via in-browser ServiceContainer)
    // ===================================================================

    public async broadcast(ruid: string, message: string): Promise<void> {
        await this.pageEvaluator.evaluateWithArgs(
            ruid,
            (message: string) => {
                const services = window.services!;
                services.room.sendAnnouncement(message, null, 0xFFFF00, "bold", 2);
                services.logger.i('system', `[Broadcast] ${message}`);
            },
            message
        );
    }

    public async whisper(ruid: string, id: number, message: string): Promise<void> {
        await this.pageEvaluator.evaluateWithArgs(
            ruid,
            (id: number, message: string) => {
                const services = window.services!;
                const playerList = services.player.getPlayerList();
                services.room.sendAnnouncement(message, id, 0xFFFF00, "bold", 2);
                services.logger.i('system', `[Whisper][to ${playerList.get(id)?.name}#${id}] ${message}`);
            },
            id,
            message
        );
    }

    public async getNotice(ruid: string): Promise<string | null> {
        return await this.pageEvaluator.evaluate(ruid, () => {
            const notice = window.services!.notification.getNotice();
            return notice || null;
        });
    }

    public async setNotice(ruid: string, message: string): Promise<void> {
        await this.pageEvaluator.evaluateWithArgs(
            ruid,
            (message: string) => {
                window.services!.notification.setNotice(message);
            },
            message
        );
    }

    // ===================================================================
    // Configuration Operations (via in-browser ServiceContainer)
    // ===================================================================

    public async setPassword(ruid: string, password: string): Promise<void> {
        await this.pageEvaluator.evaluateWithArgs(
            ruid,
            (password: string) => {
                const services = window.services!;
                const room = services.room.getRoom();
                const convertedPassword: string | null = (password == "") ? null : password;
                room.setPassword(convertedPassword);
                services.config.getConfig()._config.password = password;
            },
            password
        );
    }

    public async getNicknameTextFilteringPool(ruid: string): Promise<string[]> {
        return await this.pageEvaluator.evaluate(ruid, () => {
            return window.services!.config.getBannedWords('nickname');
        });
    }

    public async getChatTextFilteringPool(ruid: string): Promise<string[]> {
        return await this.pageEvaluator.evaluate(ruid, () => {
            return window.services!.config.getBannedWords('chat');
        });
    }

    public async setNicknameTextFilter(ruid: string, pool: string[]): Promise<void> {
        await this.pageEvaluator.evaluateWithArgs(
            ruid,
            (pool: string[]) => {
                window.services!.config.setBannedWords('nickname', pool);
            },
            pool
        );
    }

    public async setChatTextFilter(ruid: string, pool: string[]): Promise<void> {
        await this.pageEvaluator.evaluateWithArgs(
            ruid,
            (pool: string[]) => {
                window.services!.config.setBannedWords('chat', pool);
            },
            pool
        );
    }

    public async clearNicknameTextFilter(ruid: string): Promise<void> {
        await this.pageEvaluator.evaluate(ruid, () => {
            window.services!.config.setBannedWords('nickname', []);
        });
    }

    public async clearChatTextFilter(ruid: string): Promise<void> {
        await this.pageEvaluator.evaluate(ruid, () => {
            window.services!.config.setBannedWords('chat', []);
        });
    }

    public async getChatFreeze(ruid: string): Promise<boolean> {
        return await this.pageEvaluator.evaluate(ruid, () => {
            return window.services!.chat.isAllMuted();
        });
    }

    public async setChatFreeze(ruid: string, freeze: boolean): Promise<void> {
        await this.pageEvaluator.evaluateWithArgs(
            ruid,
            (freeze: boolean) => {
                const services = window.services!;
                services.chat.setAllMuted(freeze);
                services.logger.i('system', `[Freeze] Whole chat is ${freeze ? 'muted' : 'unmuted'} by Operator.`);
                window._emitSIOPlayerStatusChangeEvent(0);
            },
            freeze
        );
    }

    public async setPlayerMute(ruid: string, id: number, muteExpireTime: number): Promise<void> {
        await this.pageEvaluator.evaluateWithArgs(
            ruid,
            (id: number, muteExpireTime: number) => {
                const services = window.services!;
                const playerList = services.player.getPlayerList();
                const player = playerList.get(id)!;
                player.permissions.mute = true;
                player.permissions.muteExpire = muteExpireTime;

                services.logger.i('system', `[Mute] ${player.name}#${id} is muted by Operator.`);
                window._emitSIOPlayerStatusChangeEvent(id);
            },
            id,
            muteExpireTime
        );
    }

    public async setPlayerUnmute(ruid: string, id: number): Promise<void> {
        await this.pageEvaluator.evaluateWithArgs(
            ruid,
            (id: number) => {
                const services = window.services!;
                const playerList = services.player.getPlayerList();
                const player = playerList.get(id)!;
                player.permissions.mute = false;

                services.logger.i('system', `[Mute] ${player.name}#${id} is unmuted by Operator.`);
                window._emitSIOPlayerStatusChangeEvent(id);
            },
            id
        );
    }

    // ===================================================================
    // Team Operations (via in-browser ServiceContainer)
    // ===================================================================

    public async getTeamColours(ruid: string, team: TeamID): Promise<any> {
        return await this.pageEvaluator.evaluateWithArgs(
            ruid,
            (team: number) => {
                const teamColours = window.services!.room.getTeamColours();
                return teamColours[team === 1 ? 'red' : 'blue'];
            },
            team
        );
    }

    public async setTeamColours(
        ruid: string,
        team: TeamID,
        angle: number,
        textColour: number,
        teamColour1: number,
        teamColour2: number,
        teamColour3: number
    ): Promise<void> {
        await this.pageEvaluator.evaluateWithArgs(
            ruid,
            (team: number, angle: number, textColour: number, teamColour1: number, teamColour2: number, teamColour3: number) => {
                const services = window.services!;
                const room = services.room.getRoom();
                room.setTeamColors(team, angle, textColour, [teamColour1, teamColour2, teamColour3]);

                const teamColourData = {
                    angle: angle,
                    textColour: textColour,
                    teamColour1: teamColour1,
                    teamColour2: teamColour2,
                    teamColour3: teamColour3,
                };

                if (team === 2) {
                    services.room.setTeamColours('blue', teamColourData);
                } else {
                    services.room.setTeamColours('red', teamColourData);
                }

                services.logger.i('system', `[TeamColour] New team colour is set for Team ${team}.`);
            },
            team,
            angle,
            textColour,
            teamColour1,
            teamColour2,
            teamColour3
        );
    }

    // ===================================================================
    // Discord Operations (via in-browser ServiceContainer)
    // ===================================================================

    public async getDiscordWebhookConfig(ruid: string): Promise<DiscordWebhookConfig> {
        return await this.pageEvaluator.evaluate(ruid, () => {
            return window.services!.social.getDiscordWebhook() as DiscordWebhookConfig;
        });
    }

    public async setDiscordWebhookConfig(ruid: string, config: DiscordWebhookConfig): Promise<void> {
        await this.pageEvaluator.evaluateWithArgs(
            ruid,
            (config: DiscordWebhookConfig) => {
                window.services!.social.updateDiscordWebhook(config);
            },
            config
        );
    }
}
