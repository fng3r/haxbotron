/// <reference types="jest" />

import { describe, expect, it, jest } from "@jest/globals";
import { RoomRpcClient } from "../../../lib/room/RoomRpcClient";

describe("RoomRpcClient", () => {
    it("resolves matching responses", async () => {
        const sentRequests: unknown[] = [];
        const client = new RoomRpcClient((request) => {
            sentRequests.push(request);
        }, "test scope");

        const requestPromise = client.request("getRoomLink", undefined, 1000);
        const request = sentRequests[0] as { requestId: string; command: "getRoomLink" };

        client.handleResponse({
            type: "response",
            requestId: request.requestId,
            command: "getRoomLink",
            success: true,
            result: "https://example.com/room",
        });

        await expect(requestPromise).resolves.toBe("https://example.com/room");
    });

    it("rejects all in-flight requests when the transport fails", async () => {
        jest.useFakeTimers();

        const sentRequests: unknown[] = [];
        const client = new RoomRpcClient((request) => {
            sentRequests.push(request);
        }, "test scope");

        const requestPromise = client.request("getRoomLink", undefined, 1000);
        expect(sentRequests).toHaveLength(1);

        client.rejectAll(new Error("transport failed"));
        jest.runOnlyPendingTimers();
        jest.useRealTimers();

        await expect(requestPromise).rejects.toThrow("transport failed");
    });
});
