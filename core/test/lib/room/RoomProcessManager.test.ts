/// <reference types="jest" />

import { describe, expect, it, jest, beforeEach, afterEach } from "@jest/globals";
import { EventEmitter } from "events";
import { AnyRoomRpcRequest } from "../../../lib/room/RoomProtocol";

const mockFork = jest.fn() as jest.Mock;

jest.mock("child_process", () => ({
    fork: mockFork,
}));

class MockChildProcess extends EventEmitter {
    public send = jest.fn();
    public kill = jest.fn();
}

describe("RoomProcessManager", () => {
    let child: MockChildProcess;
    let RoomProcessManager: typeof import("../../../lib/room/RoomProcessManager").RoomProcessManager;

    beforeEach(async () => {
        jest.resetModules();
        jest.clearAllMocks();
        child = new MockChildProcess();
        mockFork.mockReturnValue(child);
        ({ RoomProcessManager } = await import("../../../lib/room/RoomProcessManager"));
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
