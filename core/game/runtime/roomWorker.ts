import HaxballJS from "haxball.js";
import { openRoomRuntime } from "../bot";
import { handleRoomCommand } from "./RoomCommandHandler";
import { RoomRuntime } from "./RoomRuntime";
import { RoomRpcRequest, RoomRpcResponse } from "../../lib/room/RoomProtocol";
import { RoomInitConfig } from "../../lib/room.hostconfig";

let roomOpen = false;
let roomRuntime: RoomRuntime | null = null;

type HBInitFunction = Awaited<ReturnType<typeof HaxballJS>>;

async function handleRequest(request: RoomRpcRequest): Promise<void> {
    try {
        if (request.command === "openRoom") {
            if (roomOpen) {
                throw new Error("Room is already initialized in this worker");
            }

            const HBInit: HBInitFunction = await HaxballJS();
            const openPayload = request.payload as { ruid: string; initConfig: RoomInitConfig };
            roomRuntime = await openRoomRuntime(HBInit, openPayload.initConfig);
            roomOpen = true;
            sendResponse({
                type: "response",
                requestId: request.requestId,
                success: true,
                result: undefined,
            });
            return;
        }

        if (!roomOpen) {
            throw new Error("Room is not initialized");
        }
        if (!roomRuntime) {
            throw new Error("Room runtime is not available");
        }

        const result = await handleRoomCommand(roomRuntime, request.command, request.payload);
        sendResponse({
            type: "response",
            requestId: request.requestId,
            success: true,
            result: result as any,
        });

        if (request.command === "closeRoom") {
            process.nextTick(() => process.exit(0));
        }
    } catch (error) {
        sendResponse({
            type: "response",
            requestId: request.requestId,
            success: false,
            error: {
                message: error instanceof Error ? error.message : String(error),
            },
        });
    }
}

function sendResponse(response: RoomRpcResponse): void {
    if (process.send) {
        process.send(response);
    }
}

process.on("message", (message: RoomRpcRequest) => {
    if (!message || typeof message !== "object" || message.type !== "request") {
        return;
    }

    void handleRequest(message);
});
