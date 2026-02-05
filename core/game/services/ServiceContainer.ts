import { Logger } from "../controller/Logger";
import { GameRoomConfig } from "../model/Configuration/GameRoomConfig";
import { Room } from "../model/RoomObject/RoomObject";
import { ChatService } from "./ChatService";
import { ConfigService } from "./ConfigService";
import { MatchService } from "./MatchService";
import { NotificationService } from "./NotificationService";
import { PlayerRoleService } from "./PlayerRoleService";
import { PlayerService } from "./PlayerService";
import { RoomService } from "./RoomService";
import { SocialService } from "./SocialService";

/**
 * Central service container (Dependency Injection container)
 * Provides singleton access to all application services
 * 
 * Usage:
 *   const services = ServiceContainer.getInstance();
 *   services.player.addPlayer(player);
 *   services.room.getRoom().sendAnnouncement("Hello!");
 */
export class ServiceContainer {
    private static instance: ServiceContainer | null = null;

    // Core services
    public readonly config: ConfigService;
    public readonly room: RoomService;
    public readonly player: PlayerService;
    public readonly playerRole: PlayerRoleService;
    public readonly match: MatchService;
    public readonly chat: ChatService;
    public readonly social: SocialService;
    public readonly notification: NotificationService;
    public readonly logger: Logger;

    private constructor(
        room: Room,
        config: GameRoomConfig,
        adminPassword: string,
        discordWebhook: any,
        logger: Logger
    ) {
        // Initialize all services
        this.config = new ConfigService(config, adminPassword);
        this.room = new RoomService(room);
        this.player = new PlayerService();
        this.playerRole = new PlayerRoleService();
        this.match = new MatchService();
        this.chat = new ChatService(config.settings.chatFloodCriterion);
        this.social = new SocialService(discordWebhook);
        this.notification = new NotificationService();
        this.logger = logger;
    }

    /**
     * Initialize the service container (call once at app startup)
     */
    public static initialize(
        room: Room,
        config: GameRoomConfig,
        adminPassword: string,
        discordWebhook: any,
        logger: Logger
    ): ServiceContainer {
        if (ServiceContainer.instance) {
            throw new Error('ServiceContainer is already initialized');
        }

        ServiceContainer.instance = new ServiceContainer(
            room,
            config,
            adminPassword,
            discordWebhook,
            logger
        );

        return ServiceContainer.instance;
    }

    /**
     * Get the singleton instance of ServiceContainer
     */
    public static getInstance(): ServiceContainer {
        if (!ServiceContainer.instance) {
            throw new Error('ServiceContainer is not initialized. Call ServiceContainer.initialize() first.');
        }

        return ServiceContainer.instance;
    }

    /**
     * Reset the container (useful for testing)
     */
    public static reset(): void {
        ServiceContainer.instance = null;
    }
}
