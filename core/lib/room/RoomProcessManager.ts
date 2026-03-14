import { ChildProcess, fork } from "child_process";
import path from "path";
import { v4 as uuid } from "uuid";
import { Server as SIOserver } from "socket.io";
import { RoomInitConfig } from "../room.hostconfig";
import {
    AnyRoomRpcResponse,
    RoomRpcCommand,
    RoomRpcPayload,
    RoomRpcResult,
    RoomWorkerEvent,
    parseRoomWorkerMessage,
} from "./RoomProtocol";
import { RoomRpcClient } from "./RoomRpcClient";

type RoomHandle = {
    ruid: string;
    child: ChildProcess;
    rpcClient: RoomRpcClient;
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
        });

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

        handle.child.on("message", (message: unknown) => {
            const parsedMessage = parseRoomWorkerMessage(message);
            if (!parsedMessage.success) {
                console.warn(
                    `[RoomProcessManager] Ignored invalid IPC message from room '${handle.ruid}': ${parsedMessage.error}`
                );
                return;
            }

            const validatedMessage = parsedMessage.value;

            if (validatedMessage.type === "event") {
                this.handleWorkerEvent(handle, validatedMessage);
                return;
            }

            this.handleWorkerResponse(handle, validatedMessage);
        });

        handle.child.on("exit", () => {
            this.resolveExit(handle);
            handle.rpcClient.rejectAll(new Error(`[RoomProcessManager] Room worker '${handle.ruid}' exited unexpectedly`));
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
            handle.rpcClient.rejectAll(error);
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

    private handleWorkerResponse(handle: RoomHandle, response: AnyRoomRpcResponse): void {
        handle.rpcClient.handleResponse(response);
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
