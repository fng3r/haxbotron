/// <reference types="jest" />

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Logger } from "../../../game/logging/Logger";
import { emitRoomLog } from "../../../game/runtime/WorkerEventBridge";
import { winstonLogger } from "../../../winstonLoggerSystem";

jest.mock("../../../game/runtime/WorkerEventBridge", () => ({
    emitRoomLog: jest.fn(),
}));

jest.mock("../../../winstonLoggerSystem", () => ({
    winstonLogger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
}));

describe("Logger", () => {
    const logCases: Array<["i" | "e" | "w", "info" | "error" | "warn"]> = [
        ["i", "info"],
        ["e", "error"],
        ["w", "warn"],
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each(logCases)("writes %s logs to Winston and emits the room event", (method, level) => {
        const logger = new Logger("room-1");

        logger[method]("game", "A message");

        expect(winstonLogger[level]).toHaveBeenCalledWith("[room-1] [game] A message");
        expect(emitRoomLog).toHaveBeenCalledWith(
            "game",
            level,
            "[room-1] [game] A message"
        );
    });
});
