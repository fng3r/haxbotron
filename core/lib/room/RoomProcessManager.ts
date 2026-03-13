import { ChildProcess, fork } from "child_process";
import path from "path";
import { v4 as uuid } from "uuid";
import { Server as SIOserver } from "socket.io";
import { RoomInitConfig } from "../room.hostconfig";
import {
    RoomRpcCommandMap,
    RoomRpcRequest,
    RoomRpcResponse,
    RoomRpcResultMap,
    RoomWorkerEvent,
    RoomWorkerMessage,
} from "./RoomProtocol";

type PendingRequest = {
    command: keyof RoomRpcCommandMap;
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
    timer: NodeJS.Timeout;
};

type RoomHandle = {
    ruid: string;
    child: ChildProcess;
    pendingRequests: Map<string, PendingRequest>;
    ready: boolean;
    roomLink?: string;
    startupTimer?: NodeJS.Timeout;
    startupResolve: () => void;
    startupReject: (reason?: unknown) => void;
    startupPromise: Promise<void>;
    exitPromise: Promise<void>;
    exitResolve: () => void;
};

const DEFAULT_COMMAND_TIMEOUT_MS = 5_000;
const ROOM_STARTUP_TIMEOUT_MS = 30_000;
const ROOM_SHUTDOWN_TIMEOUT_MS = 5_000;

export class RoomProcessManager {
    private readonly rooms = new Map<string, RoomHandle>();
    private sioServer: SIOserver | undefined;

    public attachSocketIOServer(server: SIOserver): void {
        this.sioServer = server;
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
            throw new Error(`[RoomProcessManager] Room '${ruid}' already exists`);
        }

        const workerPath = path.resolve(__dirname, "../../game/runtime/roomWorker.js");
        const child = fork(workerPath, [], {
            stdio: ["ignore", "inherit", "inherit", "ipc"],
            env: process.env,
            serialization: "advanced",
        } as any);

        const handle = this.createHandle(ruid, child);
        this.rooms.set(ruid, handle);
        this.bindChildListeners(handle);

        try {
            await this.request(handle, "openRoom", { ruid, initConfig }, ROOM_STARTUP_TIMEOUT_MS);
            await handle.startupPromise;
        } catch (error) {
            this.forceCleanupRoom(ruid, child);
            throw error;
        }
    }

    public async closeRoom(ruid: string): Promise<void> {
        const handle = this.getRoomHandle(ruid);

        try {
            await this.request(handle, "closeRoom", undefined, ROOM_SHUTDOWN_TIMEOUT_MS);
        } catch (error) {
            handle.child.kill();
            throw error;
        }

        await Promise.race([
            handle.exitPromise,
            new Promise<void>((_, reject) => {
                setTimeout(() => {
                    handle.child.kill();
                    reject(new Error(`[RoomProcessManager] Timed out while shutting down room '${ruid}'`));
                }, ROOM_SHUTDOWN_TIMEOUT_MS);
            }),
        ]);
    }

    public async requestRoom<C extends keyof RoomRpcCommandMap>(
        ruid: string,
        command: C,
        payload: RoomRpcCommandMap[C],
        timeoutMs: number = DEFAULT_COMMAND_TIMEOUT_MS
    ): Promise<RoomRpcResultMap[C]> {
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
            pendingRequests: new Map(),
            ready: false,
            startupResolve,
            startupReject,
            startupPromise,
            exitPromise,
            exitResolve,
        };
    }

    private bindChildListeners(handle: RoomHandle): void {
        handle.startupTimer = setTimeout(() => {
            handle.startupReject(new Error(`[RoomProcessManager] Timed out while starting room '${handle.ruid}'`));
        }, ROOM_STARTUP_TIMEOUT_MS);

        handle.child.on("message", (message: RoomWorkerMessage) => {
            if (!message || typeof message !== "object" || !("type" in message)) {
                return;
            }

            if (message.type === "event") {
                this.handleWorkerEvent(handle, message);
                return;
            }

            this.handleWorkerResponse(handle, message);
        });

        handle.child.on("exit", () => {
            this.resolveExit(handle);
            this.rejectPending(handle, new Error(`[RoomProcessManager] Room worker '${handle.ruid}' exited unexpectedly`));
            if (handle.startupTimer) {
                clearTimeout(handle.startupTimer);
            }
            if (!handle.ready) {
                handle.startupReject(new Error(`[RoomProcessManager] Room '${handle.ruid}' exited before becoming ready`));
            }
            this.rooms.delete(handle.ruid);
            this.emitSocketIOEvent("roomct", { ruid: handle.ruid });
        });

        handle.child.on("error", (error) => {
            this.rejectPending(handle, error);
            handle.startupReject(error);
        });
    }

    private handleWorkerEvent(handle: RoomHandle, event: RoomWorkerEvent): void {
        switch (event.event) {
            case "roomReady":
                handle.ready = true;
                handle.roomLink = event.payload.link;
                if (handle.startupTimer) {
                    clearTimeout(handle.startupTimer);
                }
                handle.startupResolve();
                this.emitSocketIOEvent("roomct", { ruid: handle.ruid });
                return;
            case "log":
                this.emitSocketIOEvent("log", {
                    id: uuid(),
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

    private handleWorkerResponse(handle: RoomHandle, response: RoomRpcResponse): void {
        const pending = handle.pendingRequests.get(response.requestId);
        if (!pending) {
            return;
        }

        clearTimeout(pending.timer);
        handle.pendingRequests.delete(response.requestId);

        if (response.success) {
            pending.resolve(response.result);
            return;
        }

        pending.reject(new Error(response.error.message));
    }

    private async request<C extends keyof RoomRpcCommandMap>(
        handle: RoomHandle,
        command: C,
        payload: RoomRpcCommandMap[C],
        timeoutMs: number
    ): Promise<RoomRpcResultMap[C]> {
        const requestId = uuid();
        const request: RoomRpcRequest<C> = {
            type: "request",
            requestId,
            command,
            payload,
        };

        const result = await new Promise<RoomRpcResultMap[C]>((resolve, reject) => {
            const timer = setTimeout(() => {
                handle.pendingRequests.delete(requestId);
                reject(new Error(`[RoomProcessManager] '${String(command)}' timed out for room '${handle.ruid}'`));
            }, timeoutMs);

            handle.pendingRequests.set(requestId, {
                command,
                resolve: (value) => resolve(value as RoomRpcResultMap[C]),
                reject,
                timer,
            });

            handle.child.send(request);
        });

        return result;
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

    private rejectPending(handle: RoomHandle, error: unknown): void {
        for (const pending of handle.pendingRequests.values()) {
            clearTimeout(pending.timer);
            pending.reject(error);
        }
        handle.pendingRequests.clear();
    }

    private resolveExit(handle: RoomHandle): void {
        handle.exitResolve();
    }

    private forceCleanupRoom(ruid: string, child: ChildProcess): void {
        child.kill();
        this.rooms.delete(ruid);
    }
}
