import { RoomProcessManager } from "./RoomProcessManager.js";
import { RoomOperationsAPI } from "./RoomOperationsAPI.js";

export { RoomProcessManager } from "./RoomProcessManager.js";
export { RoomOperationsAPI } from "./RoomOperationsAPI.js";
export type { RoomDetailInfo, RoomInfo } from "./RoomOperationsAPI.js";
export type { RoomInitConfig } from "./RoomHostConfig.js";
export type { DiscordWebhookConfig, DiscordWebhookCredentials } from "./RoomTypes.js";

export function createRoomServices(): {
    roomProcessManager: RoomProcessManager;
    roomOperations: RoomOperationsAPI;
} {
    const roomProcessManager = new RoomProcessManager();
    const roomOperations = new RoomOperationsAPI(roomProcessManager);

    return {
        roomProcessManager,
        roomOperations,
    };
}
