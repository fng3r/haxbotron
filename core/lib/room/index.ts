import { RoomProcessManager } from "./RoomProcessManager";
import { RoomOperationsAPI } from "./RoomOperationsAPI";

export { RoomProcessManager } from "./RoomProcessManager";
export { RoomOperationsAPI } from "./RoomOperationsAPI";
export type { RoomDetailInfo, RoomInfo } from "./RoomOperationsAPI";

let roomOperationsInstance: RoomOperationsAPI | null = null;

export function getRoomOperations(): RoomOperationsAPI {
    if (!roomOperationsInstance) {
        throw new Error("Room operations not initialized. Call createRoomServices() first.");
    }

    return roomOperationsInstance;
}

export async function createRoomServices(): Promise<{
    roomProcessManager: RoomProcessManager;
    roomOperations: RoomOperationsAPI;
}> {
    if (roomOperationsInstance) {
        throw new Error("Room operations already initialized");
    }

    const roomProcessManager = RoomProcessManager.getInstance();
    roomOperationsInstance = new RoomOperationsAPI(roomProcessManager);

    return {
        roomProcessManager,
        roomOperations: roomOperationsInstance,
    };
}
