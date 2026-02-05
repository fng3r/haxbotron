import { Server as SIOserver } from "socket.io";
import { BrowserManager } from "./BrowserManager";
import { PageEvaluator } from "./PageEvaluator";
import { RoomLifecycleService } from "./RoomLifecycleService";
import { RoomOperationsAPI } from "./RoomOperationsAPI";

export { BrowserManager } from "./BrowserManager";
export { PageEvaluator } from "./PageEvaluator";
export { RoomDetailInfo, RoomInfo, RoomLifecycleService } from "./RoomLifecycleService";
export { RoomOperationsAPI } from "./RoomOperationsAPI";

/**
 * Factory function to create and initialize the browser services
 */
export async function createBrowserServices(): Promise<{
    browserManager: BrowserManager;
    pageEvaluator: PageEvaluator;
    roomLifecycle: RoomLifecycleService;
    roomOperations: RoomOperationsAPI;
}> {
    const browserManager = BrowserManager.getInstance();
    await browserManager.initialize();

    const pageEvaluator = new PageEvaluator(browserManager);
    const roomLifecycle = new RoomLifecycleService(browserManager, pageEvaluator);
    const roomOperations = new RoomOperationsAPI(roomLifecycle, pageEvaluator);

    return {
        browserManager,
        pageEvaluator,
        roomLifecycle,
        roomOperations
    };
}

/**
 * Attach Socket.IO server to browser services
 */
export function attachSocketIOServer(browserManager: BrowserManager, server: SIOserver): void {
    browserManager.attachSocketIOServer(server);
}
