/// <reference types="jest" />

import { describe, expect, it } from "@jest/globals";
import { TeamID } from "../../../game/model/GameObject/TeamID";
import {
    parseRoomRpcRequest,
    parseRoomWorkerMessage,
} from "../../../lib/room/RoomProtocol";

describe("RoomProtocol validation", () => {
    it("parses valid runtime requests", () => {
        const result = parseRoomRpcRequest({
            type: "request",
            requestId: "req-1",
            command: "setTeamColours",
            payload: {
                team: TeamID.Red,
                angle: 45,
                textColour: 0xffffff,
                teamColour1: 0x111111,
                teamColour2: 0x222222,
                teamColour3: 0x333333,
            },
        });

        expect(result.success).toBe(true);
    });

    it("rejects invalid runtime request payloads", () => {
        const result = parseRoomRpcRequest({
            type: "request",
            requestId: "req-1",
            command: "setChatFreeze",
            payload: {
                freeze: "yes",
            },
        });

        expect(result.success).toBe(false);
    });

    it("parses valid worker events", () => {
        const result = parseRoomWorkerMessage({
            type: "event",
            event: "log",
            payload: {
                origin: "system",
                level: "info",
                message: "ok",
                timestamp: 1,
            },
        });

        expect(result.success).toBe(true);
    });

    it("rejects invalid worker responses", () => {
        const result = parseRoomWorkerMessage({
            type: "response",
            requestId: "req-1",
            command: "getRoomInfo",
            success: true,
            result: {
                onlinePlayers: "two",
            },
        });

        expect(result.success).toBe(false);
    });

    it("accepts empty getOnlinePlayersIDList responses", () => {
        const result = parseRoomWorkerMessage({
            type: "response",
            requestId: "req-1",
            command: "getOnlinePlayersIDList",
            success: true,
            result: [],
        });

        expect(result.success).toBe(true);
    });
});
