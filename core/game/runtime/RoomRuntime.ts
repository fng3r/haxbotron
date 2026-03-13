import { Logger } from "../controller/Logger";
import { DiscordWebhookConfig } from "../../lib/room.interface";
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

export interface RoomRuntime {
    config: ConfigService;
    room: RoomService;
    player: PlayerService;
    playerRole: PlayerRoleService;
    playerOnboarding: PlayerOnboardingService;
    match: MatchService;
    ban: BanService;
    chat: ChatService;
    social: SocialService;
    notification: NotificationService;
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
    return {
        config: new ConfigService(config, adminPassword),
        room: new RoomService(room),
        player: new PlayerService(),
        playerRole: new PlayerRoleService(),
        playerOnboarding: new PlayerOnboardingService(),
        match: new MatchService(),
        ban: new BanService(),
        chat: new ChatService(config.settings.chatFloodCriterion),
        social: new SocialService(discordWebhook, discordWebhookService),
        notification: new NotificationService(),
        logger,
    };
}
