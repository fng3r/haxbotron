import { BrowserManager } from "./BrowserManager";
import { DiscordWebhookService } from "./DiscordWebhookService";
import { PageEvaluator } from "./PageEvaluator";
import { RoomLifecycleService } from "./RoomLifecycleService";
import { RoomOperationsAPI } from "./RoomOperationsAPI";

export { BrowserManager } from "./BrowserManager";
export { DiscordWebhookService } from "./DiscordWebhookService";
export { PageEvaluator } from "./PageEvaluator";
export { RoomDetailInfo, RoomInfo, RoomLifecycleService } from "./RoomLifecycleService";
export { RoomOperationsAPI } from "./RoomOperationsAPI";

/**
 * Singleton instance of room operations
 * Initialized by calling createBrowserServices()
 */
let roomOperationsInstance: RoomOperationsAPI | null = null;

/**
 * Get the singleton room operations instance
 * Throws if not initialized
 */
export function getRoomOperations(): RoomOperationsAPI {
    if (!roomOperationsInstance) {
        throw new Error('Room operations not initialized. Call createBrowserServices() first.');
    }
    return roomOperationsInstance;
}

/**
 * Factory function to create and initialize the browser services
 */
export async function createBrowserServices(): Promise<{
    browserManager: BrowserManager;
    pageEvaluator: PageEvaluator;
    discordWebhook: DiscordWebhookService;
    roomLifecycle: RoomLifecycleService;
    roomOperations: RoomOperationsAPI;
}> {
    if (roomOperationsInstance) {
        throw new Error('Room operations already initialized');
    }

    const browserManager = BrowserManager.getInstance();
    await browserManager.initialize();

    const pageEvaluator = new PageEvaluator(browserManager);
    const discordWebhook = new DiscordWebhookService();
    const roomLifecycle = new RoomLifecycleService(browserManager, pageEvaluator, discordWebhook);
    roomOperationsInstance = new RoomOperationsAPI(roomLifecycle, pageEvaluator);

    return {
        browserManager,
        pageEvaluator,
        discordWebhook,
        roomLifecycle,
        roomOperations: roomOperationsInstance
    };
}
