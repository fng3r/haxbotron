/// <reference types="jest" />

import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { RuntimeRoomRpcRequest } from "../../../lib/room/RoomProtocol";

const mockHaxballJS = jest.fn() as jest.Mock;
const mockOpenRoomRuntime = jest.fn() as jest.Mock;
const mockHandleRoomCommand = jest.fn() as jest.Mock;
const mockSendWorkerMessage = jest.fn() as jest.Mock;
const mockWarn = jest.fn() as jest.Mock;

let messageHandler: ((message: unknown) => void) | undefined;
let exitMock: jest.Mock;
let nextTickMock: jest.Mock;
let originalProcessOn: typeof process.on;
let originalProcessExit: typeof process.exit;
let originalProcessNextTick: typeof process.nextTick;
let roomWorkerModule: typeof import("../../../game/runtime/roomWorker");

async function flushWorkerPipeline(): Promise<void> {
    await new Promise<void>((resolve) => {
        originalProcessNextTick(resolve);
    });
    await new Promise<void>((resolve) => {
        originalProcessNextTick(resolve);
    });
    await new Promise<void>((resolve) => {
        originalProcessNextTick(resolve);
    });
}

function createRuntimeCommand<C extends Exclude<keyof import("../../../lib/room/RoomProtocol").RoomRpcContract, "openRoom">>(
    command: C,
    payload: RuntimeRoomRpcRequest<C>["payload"]
): RuntimeRoomRpcRequest<C> {
    return {
        type: "request",
        requestId: "req-1",
        command,
        payload,
    };
}

describe("roomWorker pipeline", () => {
    beforeEach(async () => {
        jest.resetModules();
        jest.clearAllMocks();

        messageHandler = undefined;
        originalProcessOn = process.on.bind(process);
        originalProcessExit = process.exit.bind(process);
        originalProcessNextTick = process.nextTick.bind(process);

        jest.spyOn(console, "warn").mockImplementation(mockWarn);

        (process as NodeJS.Process).on = (((event: string, listener: (...args: unknown[]) => void) => {
            if (event === "message") {
                messageHandler = listener as (message: unknown) => void;
            }

            return process;
        }) as unknown) as typeof process.on;

        exitMock = jest.fn() as unknown as jest.Mock;
        nextTickMock = jest.fn((callback: unknown) => {
            const fn = callback as () => void;
            fn();
            return undefined;
        }) as jest.Mock;

        (process as NodeJS.Process).exit = exitMock as unknown as typeof process.exit;
        (process as NodeJS.Process).nextTick = nextTickMock as unknown as typeof process.nextTick;

        jest.doMock("haxball.js", () => ({
            __esModule: true,
            default: mockHaxballJS,
        }));
        jest.doMock("../../../game/runtime/RoomBootstrap", () => ({
            openRoomRuntime: mockOpenRoomRuntime,
        }));
        jest.doMock("../../../game/runtime/RoomCommandHandler", () => ({
            handleRoomCommand: mockHandleRoomCommand,
        }));
        jest.doMock("../../../game/runtime/WorkerEventBridge", () => ({
            sendWorkerMessage: mockSendWorkerMessage,
        }));

        roomWorkerModule = await import("../../../game/runtime/roomWorker");
        expect(roomWorkerModule).toBeDefined();
        expect(messageHandler).toBeDefined();
    });

    afterEach(() => {
        process.on = originalProcessOn;
        process.exit = originalProcessExit;
        process.nextTick = originalProcessNextTick;
        jest.restoreAllMocks();
    });

    it("opens a room and sends a success response", async () => {
        const hbInit = jest.fn();
        const runtime = { id: "runtime-1" };
        mockHaxballJS.mockImplementation(async () => hbInit);
        mockOpenRoomRuntime.mockImplementation(async () => runtime);

        messageHandler?.({
            type: "request",
            requestId: "req-open",
            command: "openRoom",
            payload: {
                ruid: "room-1",
                initConfig: {
                    ruid: "room-1",
                    _RUID: "room-1",
                    _LaunchDate: new Date("2026-01-01T00:00:00.000Z"),
                    _config: {
                        roomName: "Room 1",
                        token: "token",
                        noPlayer: true,
                        playerName: "bot",
                        public: false,
                        maxPlayers: 8,
                    },
                    rules: {
                        scoreLimit: 5,
                        timeLimit: 5,
                        teamLock: false,
                        autoAdmin: false,
                        whitelistEnabled: false,
                        defaultMapName: "classic",
                    },
                    settings: {},
                },
            },
        });

        await flushWorkerPipeline();

        expect(mockHaxballJS).toHaveBeenCalledTimes(1);
        expect(mockOpenRoomRuntime).toHaveBeenCalledWith(hbInit, expect.any(Object));
        expect(mockSendWorkerMessage).toHaveBeenCalledWith({
            type: "response",
            requestId: "req-open",
            command: "openRoom",
            success: true,
            result: undefined,
        });
    });

    it("routes runtime commands through the command handler after opening", async () => {
        const hbInit = jest.fn();
        const runtime = { id: "runtime-1" };
        mockHaxballJS.mockImplementation(async () => hbInit);
        mockOpenRoomRuntime.mockImplementation(async () => runtime);
        mockHandleRoomCommand.mockImplementation(async () => "https://example.com/room");

        messageHandler?.({
            type: "request",
            requestId: "req-open",
            command: "openRoom",
            payload: {
                ruid: "room-1",
                initConfig: {
                    ruid: "room-1",
                    _RUID: "room-1",
                    _LaunchDate: new Date("2026-01-01T00:00:00.000Z"),
                    _config: {
                        roomName: "Room 1",
                        token: "token",
                        noPlayer: true,
                        playerName: "bot",
                        public: false,
                        maxPlayers: 8,
                    },
                    rules: {
                        scoreLimit: 5,
                        timeLimit: 5,
                        teamLock: false,
                        autoAdmin: false,
                        whitelistEnabled: false,
                        defaultMapName: "classic",
                    },
                    settings: {},
                },
            },
        });

        await flushWorkerPipeline();

        messageHandler?.(createRuntimeCommand("getRoomLink", undefined));

        await flushWorkerPipeline();

        expect(mockHandleRoomCommand).toHaveBeenCalledWith(runtime, createRuntimeCommand("getRoomLink", undefined));
        expect(mockSendWorkerMessage).toHaveBeenLastCalledWith({
            type: "response",
            requestId: "req-1",
            command: "getRoomLink",
            success: true,
            result: "https://example.com/room",
        });
    });

    it("rejects runtime commands before room initialization", async () => {
        messageHandler?.(createRuntimeCommand("getRoomInfo", undefined));

        await flushWorkerPipeline();

        expect(mockSendWorkerMessage).toHaveBeenCalledWith({
            type: "response",
            requestId: "req-1",
            command: "getRoomInfo",
            success: false,
            error: {
                message: "Room is not initialized",
            },
        });
    });

    it("returns an immediate error response for invalid requests", () => {
        messageHandler?.({
            type: "request",
            requestId: "bad-1",
            command: "setChatFreeze",
            payload: {
                freeze: "yes",
            },
        });

        expect(mockSendWorkerMessage).toHaveBeenCalledWith({
            type: "response",
            requestId: "bad-1",
            command: "setChatFreeze",
            success: false,
            error: {
                message: expect.stringContaining("Invalid payload for 'setChatFreeze'"),
                code: "INVALID_RPC_REQUEST",
            },
        });
        expect(mockWarn).toHaveBeenCalledWith(expect.stringContaining("Ignored invalid IPC request"));
    });

    it("schedules process exit after closeRoom", async () => {
        const hbInit = jest.fn();
        const runtime = { id: "runtime-1" };
        mockHaxballJS.mockImplementation(async () => hbInit);
        mockOpenRoomRuntime.mockImplementation(async () => runtime);
        mockHandleRoomCommand.mockImplementation(async () => undefined);

        messageHandler?.({
            type: "request",
            requestId: "req-open",
            command: "openRoom",
            payload: {
                ruid: "room-1",
                initConfig: {
                    ruid: "room-1",
                    _RUID: "room-1",
                    _LaunchDate: new Date("2026-01-01T00:00:00.000Z"),
                    _config: {
                        roomName: "Room 1",
                        token: "token",
                        noPlayer: true,
                        playerName: "bot",
                        public: false,
                        maxPlayers: 8,
                    },
                    rules: {
                        scoreLimit: 5,
                        timeLimit: 5,
                        teamLock: false,
                        autoAdmin: false,
                        whitelistEnabled: false,
                        defaultMapName: "classic",
                    },
                    settings: {},
                },
            },
        });

        await flushWorkerPipeline();

        messageHandler?.(createRuntimeCommand("closeRoom", undefined));

        await flushWorkerPipeline();

        expect(mockHandleRoomCommand).toHaveBeenCalledWith(runtime, createRuntimeCommand("closeRoom", undefined));
        expect(nextTickMock).toHaveBeenCalledTimes(1);
        expect(exitMock).toHaveBeenCalledWith(0);
    });
});
