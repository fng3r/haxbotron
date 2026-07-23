import type { RoomObject } from "haxball.js";
import { Logger } from "../logging/Logger.js";
import { DiscordWebhookConfig } from "../../lib/room/RoomTypes.js";
import { DiscordWebhookService } from "../../lib/integrations/DiscordWebhookService.js";
import { GameRoomConfig } from "../model/Configuration/GameRoomConfig.js";
import { BanService } from "../services/BanService.js";
import { ChatService } from "../services/ChatService.js";
import { ConfigService } from "../services/ConfigService.js";
import { MatchService } from "../services/MatchService.js";
import { NotificationService } from "../services/NotificationService.js";
import { PlayerOnboardingService } from "../services/PlayerOnboardingService.js";
import { PlayerRoleService } from "../services/PlayerRoleService.js";
import { PlayerService } from "../services/PlayerService.js";
import { RoomService } from "../services/RoomService.js";
import { SocialService } from "../services/SocialService.js";
import { RoomDbRepository } from "../../lib/db/runtime/RoomDbRepository.js";

export interface RoomRuntime {
    config: ConfigService;
    room: RoomService;
    players: PlayerService;
    playerRoles: PlayerRoleService;
    playerOnboarding: PlayerOnboardingService;
    match: MatchService;
    bans: BanService;
    chat: ChatService;
    social: SocialService;
    notifications: NotificationService;
    logger: Logger;
}

export function createRoomRuntime(
    room: RoomObject,
    config: GameRoomConfig,
    adminPassword: string,
    discordWebhook: DiscordWebhookConfig,
    logger: Logger,
    discordWebhookService?: DiscordWebhookService
): RoomRuntime {
    const roomRepository = new RoomDbRepository(config._RUID);

    return {
        config: new ConfigService(config, adminPassword),
        room: new RoomService(room),
        players: new PlayerService(),
        playerRoles: new PlayerRoleService(),
        playerOnboarding: new PlayerOnboardingService(roomRepository),
        match: new MatchService(),
        bans: new BanService(roomRepository),
        chat: new ChatService(config.settings.chatFloodCriterion),
        social: new SocialService(discordWebhook, discordWebhookService),
        notifications: new NotificationService(),
        logger,
    };
}
