import { getUnixTimestamp } from "../controller/DateTimeUtils";
import { RoomWorkerEvent } from "../../lib/room/RoomProtocol";

function emitEvent(event: RoomWorkerEvent): void {
    if (!process.send) {
        return;
    }

    process.send(event);
}

export function emitRoomReady(link: string): void {
    emitEvent({
        type: "event",
        event: "roomReady",
        payload: { link },
    });
}

export function emitRoomLog(origin: string, level: "info" | "error" | "warn", message: string): void {
    emitEvent({
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
    emitEvent({
        type: "event",
        event: "joinleft",
        payload: { playerID },
    });
}

export function emitPlayerStatusChange(playerID: number): void {
    emitEvent({
        type: "event",
        event: "statuschange",
        payload: { playerID },
    });
}
