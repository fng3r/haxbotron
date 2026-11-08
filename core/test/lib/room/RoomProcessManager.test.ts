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

    it("propagates an invalid room token reported during worker startup", async () => {
        const manager = new RoomProcessManager();
        const openRoomPromise = manager.openRoom("room-1", {
            _RUID: "room-1",
            _LaunchDate: new Date("2026-01-01T00:00:00.000Z"),
            _config: {
                roomName: "Room 1", token: "expired", noPlayer: true,
                playerName: "bot", public: false, maxPlayers: 8,
            },
            rules: {
                scoreLimit: 5, timeLimit: 5, teamLock: false, autoAdmin: false,
                whitelistEnabled: false, defaultMapName: "classic",
            },
            settings: {
                antiChatFlood: true, chatFloodCriterion: 5, chatFloodIntervalMillisecs: 10_000,
                muteDefaultMillisecs: 180_000, forbidDuplicatedNickname: true,
            },
        });

        child.stderr.write("InvalidRoomTokenError: Invalid room token. Generate a new token at https://www.haxball.com/headlesstoken.\n");
        child.emit("exit", 1, null);

        await expect(openRoomPromise).rejects.toMatchObject({
            code: "INVALID_ROOM_TOKEN",
            statusCode: 400,
            message: "Invalid room token. Generate a new token at https://www.haxball.com/headlesstoken.",
        });
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
    it("does not cache, forward or allow subscriptions to disabled broadcasts", async () => {
        const manager = new RoomProcessManager();
        const startup = manager.openRoom("optional", {
            _RUID: 'optional', _LaunchDate: new Date(),
            _config: { roomName: 'Optional', token: 'token', noPlayer: true, playerName: 'bot', public: false, maxPlayers: 8 },
            rules: { scoreLimit: 3, timeLimit: 3, teamLock: false, autoAdmin: false, whitelistEnabled: false, defaultMapName: 'classic' },
            settings: { liveBroadcast: false, antiChatFlood: true, chatFloodCriterion: 5,
                chatFloodIntervalMillisecs: 10000, muteDefaultMillisecs: 10000, forbidDuplicatedNickname: true },
        });
        const opening = child.send.mock.calls[0][0] as AnyRoomRpcRequest;
        child.emit('message', { type: 'response', requestId: opening.requestId, command: 'openRoom', success: true, result: undefined });
        child.emit('message', { type: 'event', event: 'roomReady', payload: { link: 'https://example.com' } });
        await startup;
        const forwarded = jest.fn();
        const server = Object.assign(new EventEmitter(), {
            sockets: { emit: jest.fn() },
            to: () => ({ emit: forwarded, volatile: { emit: forwarded } }),
        });
        manager.attachSocketIOServer(server as never);
        const completed = {
            matchId: 'completed', startedAt: 1000, endedAt: 2000, revision: 2,
            events: [{ id: 'stop', type: 'stop', time: 1, timestamp: 2000 }],
            startingLineups: { red: [], blue: [] }, playtime: 1,
            scores: { red: 0, blue: 0 }, outcome: 'stopped',
        };
        child.emit('message', { type: 'event', event: 'matchCompleted', payload: completed });
        expect(server.sockets.emit).toHaveBeenCalledWith('match:completed', { ruid: 'optional', match: completed });

        const socket = Object.assign(new EventEmitter(), { rooms: new Set<string>(), join: jest.fn(), leave: jest.fn() });
        const clientEvents = jest.spyOn(socket, 'emit');
        server.emit('connection', socket);
        const subscribe = jest.fn();
        const frame = { sequence: 1, timestamp: 1, status: 'stopped', scores: null, players: [], discs: [] };
        child.emit('message', { type: 'event', event: 'live', payload: frame });
        socket.emit('live:subscribe', 'optional', subscribe);
        expect(subscribe).toHaveBeenLastCalledWith(expect.objectContaining({ ok: false }));
        expect(forwarded).not.toHaveBeenCalled();
        expect(socket.join).not.toHaveBeenCalled();
        child.emit('message', { type: 'event', event: 'liveBroadcastState', payload: { enabled: true } });
        child.emit('message', { type: 'event', event: 'live', payload: frame });
        expect(forwarded).toHaveBeenCalledWith('live', expect.objectContaining({ ruid: 'optional' }));
        socket.emit('live:subscribe', 'optional', subscribe);
        expect(subscribe).toHaveBeenLastCalledWith({ ok: true });
        expect(clientEvents).toHaveBeenCalledWith('live', expect.objectContaining({ ruid: 'optional' }));
        child.emit('message', { type: 'event', event: 'liveBroadcastState', payload: { enabled: false } });
        expect(forwarded).toHaveBeenLastCalledWith('live:offline', { ruid: 'optional', reason: 'Broadcast disabled' });
        forwarded.mockClear();
        child.emit('message', { type: 'event', event: 'live', payload: frame });
        expect(forwarded).not.toHaveBeenCalled();
        child.emit('message', { type: 'event', event: 'liveBroadcastState', payload: { enabled: true } });
        clientEvents.mockClear();
        socket.emit('live:subscribe', 'optional', subscribe);
        expect(clientEvents.mock.calls.filter(([event]) => event === 'live')).toHaveLength(0);
        child.emit('exit', 0, null);
    });

});
