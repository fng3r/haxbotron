/// <reference types="jest" />

import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import { AnyRoomRpcRequest } from "../../../src/lib/room/RoomProtocol.js";

const mockFork = jest.fn() as jest.Mock;
const mockWinstonLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
};

jest.unstable_mockModule("node:child_process", () => ({
    fork: mockFork,
}));

jest.unstable_mockModule("../../../src/winstonLoggerSystem.js", () => ({
    winstonLogger: mockWinstonLogger,
}));

class MockChildProcess extends EventEmitter {
    public send = jest.fn();
    public kill = jest.fn();
    public stderr = new PassThrough();
}

describe("RoomProcessManager", () => {
    let child: MockChildProcess;
    let RoomProcessManager: typeof import("../../../src/lib/room/RoomProcessManager.js").RoomProcessManager;

    beforeEach(async () => {
        jest.resetModules();
        jest.clearAllMocks();
        child = new MockChildProcess();
        mockFork.mockReturnValue(child);
        ({ RoomProcessManager } = await import("../../../src/lib/room/RoomProcessManager.js"));
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("rejects pending requests immediately when worker response is invalid", async () => {
        const manager = new RoomProcessManager();
        const openRoomPromise = manager.openRoom("room-1", {
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
            settings: {
                antiChatFlood: true,
                chatFloodCriterion: 5,
                chatFloodIntervalMillisecs: 10_000,
                muteDefaultMillisecs: 180_000,
                forbidDuplicatedNickname: true,
            },
        });

        const openRoomRequest = child.send.mock.calls[0][0] as AnyRoomRpcRequest;
        child.emit("message", {
            type: "response",
            requestId: openRoomRequest.requestId,
            command: "openRoom",
            success: true,
            result: undefined,
        });
        child.emit("message", {
            type: "event",
            event: "roomReady",
            payload: {
                link: "https://example.com/room",
            },
        });

        await openRoomPromise;

        child.stderr.write("TypeError: worker crashed\n    at roomWorker.js:1:1\n");

        expect(mockWinstonLogger.error).toHaveBeenCalledWith(
            "[RoomProcessManager] [room-1] Worker stderr:\nTypeError: worker crashed\n    at roomWorker.js:1:1"
        );

        child.emit("message", {
            type: "event",
            event: "log",
            payload: {
                origin: "game",
                level: "info",
                message: "[room-1] [game] A message",
                timestamp: 1,
            },
        });

        expect(mockWinstonLogger.log).toHaveBeenCalledWith("info", "[room-1] [game] A message");

        const requestPromise = manager.requestRoom("room-1", "getOnlinePlayersIDList", undefined, 1000);
        const request = child.send.mock.calls[1][0] as AnyRoomRpcRequest;

        child.emit("message", {
            type: "response",
            requestId: request.requestId,
            command: "getOnlinePlayersIDList",
            success: true,
            result: {
                broken: true,
            },
        });

        await expect(requestPromise).rejects.toThrow("Invalid worker response for 'getOnlinePlayersIDList'");
    });
});
