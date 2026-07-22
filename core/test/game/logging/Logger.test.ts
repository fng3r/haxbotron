/// <reference types="jest" />

import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockEmitRoomLog = jest.fn();

jest.unstable_mockModule("../../../src/game/runtime/WorkerEventBridge.js", () => ({
    emitRoomLog: mockEmitRoomLog,
}));

const { Logger } = await import("../../../src/game/logging/Logger.js");

describe("Logger", () => {
    const logCases: Array<["i" | "e" | "w", "info" | "error" | "warn"]> = [
        ["i", "info"],
        ["e", "error"],
        ["w", "warn"],
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each(logCases)("dispatches %s logs as room events", (method, level) => {
        const logger = new Logger("room-1");

        logger[method]("game", "A message");

        expect(mockEmitRoomLog).toHaveBeenCalledWith(
            "game",
            level,
            "[room-1] [game] A message"
        );
    });
});
