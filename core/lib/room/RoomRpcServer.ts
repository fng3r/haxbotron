import {
    AnyRoomRpcResponse,
    RoomRpcCommand,
    RoomRpcRequest,
    RoomRpcResultMap,
} from "./RoomProtocol";

export class RoomRpcServer {
    constructor(private readonly sendResponse: (response: AnyRoomRpcResponse) => void) {}

    public async handleRequest<C extends RoomRpcCommand>(
        request: RoomRpcRequest<C>,
        handler: () => Promise<RoomRpcResultMap[C]> | RoomRpcResultMap[C]
    ): Promise<void> {
        try {
            const result = await handler();
            this.sendResponse({
                type: "response",
                requestId: request.requestId,
                command: request.command,
                success: true,
                result,
            } as AnyRoomRpcResponse);
        } catch (error) {
            this.sendResponse({
                type: "response",
                requestId: request.requestId,
                command: request.command,
                success: false,
                error: {
                    message: error instanceof Error ? error.message : String(error),
                },
            } as AnyRoomRpcResponse);
        }
    }
}
