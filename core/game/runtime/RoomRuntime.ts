import { Logger } from "../logging/Logger";
import { DiscordWebhookConfig } from "../../lib/room/RoomTypes";
import { DiscordWebhookService } from "../../lib/integrations/DiscordWebhookService";
import { GameRoomConfig } from "../model/Configuration/GameRoomConfig";
import { BanService } from "../services/BanService";
import { ChatService } from "../services/ChatService";
import { ConfigService } from "../services/ConfigService";
import { MatchService } from "../services/MatchService";
import { NotificationService } from "../services/NotificationService";
import { PlayerOnboardingService } from "../services/PlayerOnboardingService";
import { PlayerRoleService } from "../services/PlayerRoleService";
import { PlayerService } from "../services/PlayerService";
import { RoomService } from "../services/RoomService";
import { SocialService } from "../services/SocialService";
import { RoomDbRepository } from "../../lib/db/runtime/RoomDbRepository";

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
