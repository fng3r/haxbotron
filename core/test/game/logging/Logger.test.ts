/// <reference types="jest" />

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Logger } from "../../../game/logging/Logger";
import { emitRoomLog } from "../../../game/runtime/WorkerEventBridge";

jest.mock("../../../game/runtime/WorkerEventBridge", () => ({
    emitRoomLog: jest.fn(),
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

    it.each(logCases)("dispatches %s logs as room events", (method, level) => {
        const logger = new Logger("room-1");

        logger[method]("game", "A message");

        expect(emitRoomLog).toHaveBeenCalledWith(
            "game",
            level,
            "[room-1] [game] A message"
        );
    });
});
