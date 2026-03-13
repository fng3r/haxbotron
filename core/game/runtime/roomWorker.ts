import HaxballJS from "haxball.js";
import { openRoomRuntime } from "../bot";
import { handleRoomCommand } from "./RoomCommandHandler";
import { RoomRuntime } from "./RoomRuntime";
import { sendWorkerMessage } from "./WorkerEventBridge";
import {
    AnyRoomRpcRequest,
    RoomRpcCommand,
    RoomRpcRequest,
    RoomRpcResponse,
    RoomRpcResultMap,
    isRoomRpcRequest,
} from "../../lib/room/RoomProtocol";

let roomOpen = false;
let roomRuntime: RoomRuntime | null = null;

type HBInitFunction = Awaited<ReturnType<typeof HaxballJS>>;

async function handleRequest(request: AnyRoomRpcRequest): Promise<void> {
    try {
        if (request.command === "openRoom") {
            if (roomOpen) {
                throw new Error("Room is already initialized in this worker");
            }

            const HBInit: HBInitFunction = await HaxballJS();
            roomRuntime = await openRoomRuntime(HBInit, request.payload.initConfig);
            roomOpen = true;
            sendSuccessResponse(request, undefined);
            return;
        }

        if (!roomOpen) {
            throw new Error("Room is not initialized");
        }
        if (!roomRuntime) {
            throw new Error("Room runtime is not available");
        }

        const result = await handleRoomCommand(roomRuntime, request);
        sendSuccessResponse(request, result);

        if (request.command === "closeRoom") {
            process.nextTick(() => process.exit(0));
        }
    } catch (error) {
        sendErrorResponse(request, error);
    }
}

function sendResponse<C extends RoomRpcCommand>(response: RoomRpcResponse<C>): void {
    sendWorkerMessage(response);
}

function sendSuccessResponse<C extends RoomRpcCommand>(request: RoomRpcRequest<C>, result: RoomRpcResultMap[C]): void {
    sendResponse({
        type: "response",
        requestId: request.requestId,
        command: request.command,
        success: true,
        result,
    });
}

function sendErrorResponse<C extends RoomRpcCommand>(request: RoomRpcRequest<C>, error: unknown): void {
    sendResponse({
        type: "response",
        requestId: request.requestId,
        command: request.command,
        success: false,
        error: {
            message: error instanceof Error ? error.message : String(error),
        },
    });
}

process.on("message", (message: unknown) => {
    if (!isRoomRpcRequest(message)) {
        return;
    }

    void handleRequest(message);
});
