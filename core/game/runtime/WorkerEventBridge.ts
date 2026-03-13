import { getUnixTimestamp } from "../controller/DateTimeUtils";
import {
    AnyRoomRpcResponse,
    RoomRpcCommand,
    RoomRpcResponse,
    RoomWorkerEvent,
} from "../../lib/room/RoomProtocol";

export function sendWorkerMessage<C extends RoomRpcCommand>(message: RoomRpcResponse<C>): void;
export function sendWorkerMessage(message: RoomWorkerEvent): void;
export function sendWorkerMessage(message: AnyRoomRpcResponse | RoomWorkerEvent): void {
    if (!process.send) {
        return;
    }

    process.send(message);
}

export function emitRoomReady(link: string): void {
    sendWorkerMessage({
        type: "event",
        event: "roomReady",
        payload: { link },
    });
}

export function emitRoomLog(origin: string, level: "info" | "error" | "warn", message: string): void {
    sendWorkerMessage({
        type: "event",
        event: "log",
        payload: {
            origin,
            level,
            message,
            timestamp: getUnixTimestamp(),
        },
    });
}

export function emitPlayerJoinLeave(playerID: number): void {
    sendWorkerMessage({
        type: "event",
        event: "joinleft",
        payload: { playerID },
    });
}

export function emitPlayerStatusChange(playerID: number): void {
    sendWorkerMessage({
        type: "event",
        event: "statuschange",
        payload: { playerID },
    });
}
