import HaxballJS from "haxball.js";
import { openRoomRuntime } from "../bot";
import { handleRoomCommand } from "./RoomCommandHandler";
import { RoomRuntime } from "./RoomRuntime";
import { sendWorkerMessage } from "./WorkerEventBridge";
import {
    AnyRoomRpcRequest,
    AnyRoomRpcResponse,
    RoomRpcCommand,
    parseRoomRpcRequest,
} from "../../lib/room/RoomProtocol";
import { RoomRpcServer } from "../../lib/room/RoomRpcServer";

let roomOpen = false;
let roomRuntime: RoomRuntime | null = null;
const rpcServer = new RoomRpcServer(sendWorkerMessage);

type HBInitFunction = Awaited<ReturnType<typeof HaxballJS>>;

async function handleRequest(request: AnyRoomRpcRequest): Promise<void> {
    await rpcServer.handleRequest(request, async () => {
        if (request.command === "openRoom") {
            if (roomOpen) {
                throw new Error("Room is already initialized in this worker");
            }

            const HBInit: HBInitFunction = await HaxballJS();
            roomRuntime = await openRoomRuntime(HBInit, request.payload.initConfig);
            roomOpen = true;
            return undefined;
        }

        if (!roomOpen) {
            throw new Error("Room is not initialized");
        }
        if (!roomRuntime) {
            throw new Error("Room runtime is not available");
        }

        const result = await handleRoomCommand(roomRuntime, request);

        if (request.command === "closeRoom") {
            process.nextTick(() => process.exit(0));
        }

        return result;
    });
}

process.on("message", (message: unknown) => {
    const parsedRequest = parseRoomRpcRequest(message);
    if (!parsedRequest.success) {
        console.warn(`[roomWorker] Ignored invalid IPC request: ${parsedRequest.error}`);
        if (
            message &&
            typeof message === "object" &&
            "type" in message &&
            message.type === "request" &&
            "requestId" in message &&
            typeof message.requestId === "string" &&
            "command" in message &&
            typeof message.command === "string"
        ) {
            sendWorkerMessage({
                type: "response",
                requestId: message.requestId,
                command: message.command as RoomRpcCommand,
                success: false,
                error: {
                    message: parsedRequest.error,
                    code: "INVALID_RPC_REQUEST",
                },
            } as AnyRoomRpcResponse);
        }
        return;
    }

    void handleRequest(parsedRequest.value);
});
