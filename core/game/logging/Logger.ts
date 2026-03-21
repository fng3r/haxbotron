import { emitRoomLog } from "../runtime/WorkerEventBridge";

export class Logger {
    constructor(private readonly roomId: string) {}

    private format(origin: string, message: string): string {
        return `[${this.roomId}] [${origin}] ${message}`;
    }

    public i(origin: string, msg: string): void { // for common info log
        const formattedMessage = this.format(origin, msg);
        console.info(formattedMessage);
        emitRoomLog(origin, "info", formattedMessage);
    }

    public e(origin: string, msg: string): void { // for error log
        const formattedMessage = this.format(origin, msg);
        console.error(formattedMessage);
        emitRoomLog(origin, "error", formattedMessage);
    }

    public w(origin: string, msg: string): void { // for warning log
        const formattedMessage = this.format(origin, msg);
        console.warn(formattedMessage);
        emitRoomLog(origin, "warn", formattedMessage);
    }
}
