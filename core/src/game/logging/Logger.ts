import { emitRoomLog } from "../runtime/WorkerEventBridge.js";

export class Logger {
    constructor(private readonly roomId: string) {}

    private format(origin: string, message: string): string {
        return `[${this.roomId}] [${origin}] ${message}`;
    }

    public i(origin: string, msg: string): void { // for common info log
        const formattedMessage = this.format(origin, msg);
        emitRoomLog(origin, "info", formattedMessage);
    }

    public e(origin: string, msg: string): void { // for error log
        const formattedMessage = this.format(origin, msg);
        emitRoomLog(origin, "error", formattedMessage);
    }

    public w(origin: string, msg: string): void { // for warning log
        const formattedMessage = this.format(origin, msg);
        emitRoomLog(origin, "warn", formattedMessage);
    }
}
