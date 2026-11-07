import type { LiveFrame, LiveMatchTimeline, LiveStadium } from "./LiveProtocol.js";
import { randomUUID } from "node:crypto";
import { fork, type ChildProcess } from "node:child_process";
import { Server as SIOserver } from "socket.io";
import { winstonLogger } from "../../winstonLoggerSystem.js";
import { InvalidRoomTokenError, RoomCreationError } from "../errors.js";
import { RoomInitConfig } from "./RoomHostConfig.js";
import {
    AnyRoomRpcResponse,
    RoomRpcCommand,
    RoomRpcPayload,
    RoomRpcResult,
    RoomWorkerEvent,
    isRoomRpcCommandName,
    parseRoomWorkerMessage,
} from "./RoomProtocol.js";
import { RoomRpcClient } from "./RoomRpcClient.js";

type RoomHandle = {
    ruid: string;
    child: ChildProcess;
    rpcClient: RoomRpcClient;
    ready: boolean;
    shuttingDown: boolean;
    roomLink?: string;
    broadcastEnabled?: boolean;
    liveFrame?: LiveFrame;
    liveStadium?: LiveStadium;
    liveTimeline?: LiveMatchTimeline;
    startupTimer?: NodeJS.Timeout;
    startupResolve: () => void;
    startupReject: (reason?: unknown) => void;
    startupPromise: Promise<void>;
    exitPromise: Promise<void>;
    exitResolve: () => void;
    startupStderr: string;
};

const DEFAULT_COMMAND_TIMEOUT_MS = 5_000;
const ROOM_STARTUP_TIMEOUT_MS = 30_000;
const ROOM_SHUTDOWN_TIMEOUT_MS = 5_000;

export class RoomProcessManager {
    private readonly rooms = new Map<string, RoomHandle>();
    private sioServer: SIOserver | undefined;

    public attachSocketIOServer(server: SIOserver): void {
        this.sioServer = server;
        server.on("connection", socket => {
            socket.on("live:subscribe", (ruid: unknown, ack?: (result: { ok: boolean; error?: string }) => void) => {
                if (typeof ruid !== "string" || !this.rooms.has(ruid)) {
                    if (typeof ack === "function") ack({ ok: false, error: "Room is offline" });
                    return;
                }
                if (this.rooms.get(ruid)?.broadcastEnabled === false) {
                    if (typeof ack === "function") ack({ ok: false, error: "Broadcast disabled" });
                    return;
                }
                // A socket watches one room at a time.
                for (const joined of socket.rooms) if (joined.startsWith("live:") && joined !== `live:${ruid}`) void socket.leave(joined);
                void socket.join(`live:${ruid}`);
                const handle = this.rooms.get(ruid)!;
                if (handle.liveFrame) socket.emit("live", { ruid, ...handle.liveFrame, stadium: handle.liveStadium,
                    timeline: handle.liveTimeline?.matchId === handle.liveFrame.matchId ? handle.liveTimeline : undefined });
                if (typeof ack === "function") ack({ ok: true });
            });
            socket.on("live:unsubscribe", () => {
                for (const joined of socket.rooms) if (joined.startsWith("live:")) void socket.leave(joined);
            });
        });
    }

    public hasRoom(ruid: string): boolean {
        return this.rooms.has(ruid);
    }

    public getAllRoomIds(): string[] {
        return Array.from(this.rooms.keys());
    }

    public getRoomCount(): number {
        return this.rooms.size;
    }

    public async openRoom(ruid: string, initConfig: RoomInitConfig): Promise<void> {
        if (this.rooms.has(ruid)) {
            winstonLogger.warn(`[RoomProcessManager] [${ruid}] Refused to open duplicate room`);
            throw new Error(`[RoomProcessManager] Room '${ruid}' already exists`);
        }

        winstonLogger.info(`[RoomProcessManager] [${ruid}] Starting room worker`);
        const workerUrl = new URL("../../game/runtime/roomWorker.js", import.meta.url);
        const child = fork(workerUrl, [], {
            stdio: ["ignore", "inherit", "pipe", "ipc"],
            env: process.env,
            serialization: "advanced",
        });

        const handle = this.createHandle(ruid, child);
        handle.broadcastEnabled = initConfig.settings.liveBroadcast !== false;
        this.rooms.set(ruid, handle);
        this.bindChildListeners(handle);

        try {
            await Promise.all([
                this.request(handle, "openRoom", { ruid, initConfig }, ROOM_STARTUP_TIMEOUT_MS),
                handle.startupPromise,
            ]);
        } catch (error) {
            winstonLogger.error(
                `[RoomProcessManager] [${ruid}] Failed to start room worker: ${error}`
            );
            this.forceCleanupRoom(ruid, child);
            throw error;
        }
    }

    public async closeRoom(ruid: string): Promise<void> {
        const handle = this.getRoomHandle(ruid);
        handle.shuttingDown = true;
        winstonLogger.info(`[RoomProcessManager] [${ruid}] Stopping room worker`);

        try {
            await this.request(handle, "closeRoom", undefined, ROOM_SHUTDOWN_TIMEOUT_MS);
        } catch (error) {
            winstonLogger.error(
                `[RoomProcessManager] [${ruid}] Graceful shutdown failed: ${error}`
            );
            handle.child.kill();
            throw error;
        }

        try {
            await Promise.race([
                handle.exitPromise,
                new Promise<void>((_, reject) => {
                    setTimeout(() => {
                        handle.child.kill();
                        reject(new Error(`[RoomProcessManager] Timed out while shutting down room '${ruid}'`));
                    }, ROOM_SHUTDOWN_TIMEOUT_MS);
                }),
            ]);
            winstonLogger.info(`[RoomProcessManager] [${ruid}] Room worker stopped`);
        } catch (error) {
            winstonLogger.error(
                `[RoomProcessManager] [${ruid}] Failed to stop room worker: ${error}`
            );
            throw error;
        }
    }

    public async requestRoom<C extends RoomRpcCommand>(
        ruid: string,
        command: C,
        payload: RoomRpcPayload<C>,
        timeoutMs: number = DEFAULT_COMMAND_TIMEOUT_MS
    ): Promise<RoomRpcResult<C>> {
        const handle = this.getRoomHandle(ruid);
        return await this.request(handle, command, payload, timeoutMs);
    }

    private createHandle(ruid: string, child: ChildProcess): RoomHandle {
        let startupResolve!: () => void;
        let startupReject!: (reason?: unknown) => void;
        let exitResolve!: () => void;

        const startupPromise = new Promise<void>((resolve, reject) => {
            startupResolve = resolve;
            startupReject = reject;
        });
        const exitPromise = new Promise<void>((resolve) => {
            exitResolve = resolve;
        });

        return {
            ruid,
            child,
            rpcClient: new RoomRpcClient(
                (request) => {
                    child.send(request);
                },
                `room '${ruid}'`
            ),
            ready: false,
            shuttingDown: false,
            startupResolve,
            startupReject,
            startupPromise,
            exitPromise,
            exitResolve,
            startupStderr: "",
        };
    }

    private bindChildListeners(handle: RoomHandle): void {
        handle.startupTimer = setTimeout(() => {
            winstonLogger.error(
                `[RoomProcessManager] [${handle.ruid}] Room worker startup timed out`
            );
            handle.startupReject(new Error(`[RoomProcessManager] Timed out while starting room '${handle.ruid}'`));
        }, ROOM_STARTUP_TIMEOUT_MS);

        handle.child.stderr?.setEncoding("utf8");
        handle.child.stderr?.on("data", (output: string | Buffer) => {
            const message = output.toString().replace(/\s+$/, "");
            if (message) {
                handle.startupStderr = `${handle.startupStderr}\n${message}`.slice(-16_384);
                winstonLogger.error(
                    `[RoomProcessManager] [${handle.ruid}] Worker stderr:\n${message}`
                );
            }
        });

        handle.child.on("message", (message: unknown) => {
            const parsedMessage = parseRoomWorkerMessage(message);
            if (!parsedMessage.success) {
                winstonLogger.warn(
                    `[RoomProcessManager] [${handle.ruid}] Ignored invalid IPC message: ${parsedMessage.error}`
                );
                this.rejectInvalidWorkerResponse(handle, message, parsedMessage.error);
                return;
            }

            const validatedMessage = parsedMessage.value;

            if (validatedMessage.type === "event") {
                this.handleWorkerEvent(handle, validatedMessage);
                return;
            }

            this.handleWorkerResponse(handle, validatedMessage);
        });

        handle.child.on("exit", (code, signal) => {
            const exitDetails = `code=${code ?? "null"}, signal=${signal ?? "null"}`;
            if (handle.shuttingDown) {
                winstonLogger.info(
                    `[RoomProcessManager] [${handle.ruid}] Room worker exited (${exitDetails})`
                );
            } else {
                winstonLogger.error(
                    `[RoomProcessManager] [${handle.ruid}] Room worker exited unexpectedly (${exitDetails})`
                );
            }
            const startupError = !handle.ready ? this.getStartupError(handle) : undefined;
            this.resolveExit(handle);
            handle.rpcClient.rejectAll(
                startupError ?? new Error(`[RoomProcessManager] Room worker '${handle.ruid}' exited unexpectedly`)
            );
            if (handle.startupTimer) {
                clearTimeout(handle.startupTimer);
            }
            if (!handle.ready) {
                winstonLogger.error(
                    `[RoomProcessManager] [${handle.ruid}] Room worker exited before becoming ready`
                );
                handle.startupReject(startupError);
            }
            if (handle.broadcastEnabled !== false) this.sioServer?.to(`live:${handle.ruid}`).emit("live:offline", { ruid: handle.ruid });
            this.rooms.delete(handle.ruid);
            this.emitSocketIOEvent("roomct", { ruid: handle.ruid });
        });

        handle.child.on("error", (error) => {
            winstonLogger.error(
                `[RoomProcessManager] [${handle.ruid}] Child process error: ${error.message}`
            );
            handle.rpcClient.rejectAll(error);
            handle.startupReject(error);
        });
    }

    private getStartupError(handle: RoomHandle): Error {
        if (/InvalidRoomTokenError|Invalid room token/i.test(handle.startupStderr)) {
            return new InvalidRoomTokenError();
        }

        const errorMatch = handle.startupStderr.match(/^([A-Za-z][A-Za-z0-9]*Error):\s*([^\n]+)/m);
        if (errorMatch) {
            return new RoomCreationError(`Room failed to start: ${errorMatch[2]}`);
        }

        return new RoomCreationError(`Room '${handle.ruid}' exited before becoming ready`);
    }

    private handleWorkerEvent(handle: RoomHandle, event: RoomWorkerEvent): void {
        switch (event.event) {
            case "liveBroadcastState":
                handle.broadcastEnabled = event.payload.enabled;
                if (!event.payload.enabled) {
                    handle.liveFrame = undefined;
                    handle.liveStadium = undefined;
                    handle.liveTimeline = undefined;
                    this.sioServer?.to(`live:${handle.ruid}`).emit("live:offline", { ruid: handle.ruid, reason: "Broadcast disabled" });
                } else if (handle.ready) {
                    this.sioServer?.emit("roomct", { ruid: handle.ruid });
                }
                return;
            case "liveKick":
                if (handle.broadcastEnabled === false) return;
                this.sioServer?.to(`live:${handle.ruid}`).emit("live:kick", { ruid: handle.ruid, ...event.payload });
                return;
            case "live":
                if (handle.broadcastEnabled === false) return;
                const newGoal = event.payload.goal && event.payload.goal.id !== handle.liveFrame?.goal?.id;
                if (handle.liveTimeline?.matchId !== event.payload.matchId) handle.liveTimeline = undefined;
                if (event.payload.timeline?.matchId === event.payload.matchId) handle.liveTimeline = event.payload.timeline;
                handle.liveFrame = event.payload;
                if (event.payload.stadium) handle.liveStadium = event.payload.stadium;
                // Metadata is reliable; transient frames may be dropped for slow viewers.
                if (event.payload.stadium || newGoal || event.payload.timeline) this.sioServer?.to(`live:${handle.ruid}`).emit("live", { ruid: handle.ruid, ...event.payload });
                else this.sioServer?.to(`live:${handle.ruid}`).volatile.emit("live", { ruid: handle.ruid, ...event.payload });
                return;
            case "roomReady":
                handle.ready = true;
                handle.roomLink = event.payload.link;
                winstonLogger.info(
                    `[RoomProcessManager] [${handle.ruid}] Room worker is ready`
                );
                if (handle.startupTimer) {
                    clearTimeout(handle.startupTimer);
                }
                handle.startupResolve();
                this.emitSocketIOEvent("roomct", { ruid: handle.ruid });
                return;
            case "log":
                winstonLogger.log(event.payload.level, event.payload.message);
                this.emitSocketIOEvent("log", {
                    id: randomUUID(),
                    ruid: handle.ruid,
                    origin: event.payload.origin,
                    type: event.payload.level,
                    message: event.payload.message,
                    timestamp: event.payload.timestamp,
                });
                return;
            case "joinleft":
                this.emitSocketIOEvent("joinleft", {
                    ruid: handle.ruid,
                    playerID: event.payload.playerID,
                });
                return;
            case "statuschange":
                this.emitSocketIOEvent("statuschange", {
                    ruid: handle.ruid,
                    playerID: event.payload.playerID,
                });
                return;
        }
    }

    private handleWorkerResponse(handle: RoomHandle, response: AnyRoomRpcResponse): void {
        handle.rpcClient.handleResponse(response);
    }

    private rejectInvalidWorkerResponse(handle: RoomHandle, message: unknown, errorMessage: string): void {
        if (
            !message ||
            typeof message !== "object" ||
            !("type" in message) ||
            message.type !== "response" ||
            !("requestId" in message) ||
            typeof message.requestId !== "string" ||
            !("command" in message) ||
            !isRoomRpcCommandName(message.command)
        ) {
            return;
        }

        handle.rpcClient.handleResponse({
            type: "response",
            requestId: message.requestId,
            command: message.command,
            success: false,
            error: {
                message: `[RoomProcessManager] Invalid worker response for '${message.command}' in room '${handle.ruid}': ${errorMessage}`,
                code: "INVALID_RPC_RESPONSE",
            },
        });
    }

    private async request<C extends RoomRpcCommand>(
        handle: RoomHandle,
        command: C,
        payload: RoomRpcPayload<C>,
        timeoutMs: number
    ): Promise<RoomRpcResult<C>> {
        return await handle.rpcClient.request(command, payload, timeoutMs);
    }

    private getRoomHandle(ruid: string): RoomHandle {
        const handle = this.rooms.get(ruid);
        if (!handle) {
            throw new Error(`[RoomProcessManager] Room '${ruid}' does not exist`);
        }

        return handle;
    }

    private emitSocketIOEvent(event: string, data: unknown): void {
        this.sioServer?.sockets.emit(event, data);
    }

    private resolveExit(handle: RoomHandle): void {
        handle.exitResolve();
    }

    private forceCleanupRoom(ruid: string, child: ChildProcess): void {
        child.kill();
        this.rooms.delete(ruid);
    }
}
