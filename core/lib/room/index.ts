import { RoomProcessManager } from "./RoomProcessManager";
import { RoomOperationsAPI } from "./RoomOperationsAPI";

export { RoomProcessManager } from "./RoomProcessManager";
export { RoomOperationsAPI } from "./RoomOperationsAPI";
export type { RoomDetailInfo, RoomInfo } from "./RoomOperationsAPI";
export type { RoomInitConfig } from "./RoomHostConfig";
export type { DiscordWebhookConfig, DiscordWebhookCredentials } from "./RoomTypes";

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
