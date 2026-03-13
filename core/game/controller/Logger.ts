import { emitRoomLog } from "../runtime/WorkerEventBridge";

export class Logger {
    private static instance: Logger | null = null;

    private Logger() { } // not use
    
    public static getInstance(): Logger {
        if (this.instance == null) {
            this.instance = new Logger();
        }
        return this.instance;
    }

    public i(origin: string, msg: string): void { // for common info log
        console.info(msg);
        emitRoomLog(origin, "info", msg);
    }

    public e(origin: string, msg: string): void { // for error log
        console.error(msg);
        emitRoomLog(origin, "error", msg);
    }

    public w(origin: string, msg: string): void { // for warning log
        console.warn(msg);
        emitRoomLog(origin, "warn", msg);
    }

    public static reset(): void {
        this.instance = null;
    }
}
