/// <reference types="jest" />

import { describe, expect, it, jest } from "@jest/globals";
import { RoomRpcClient } from "../../../src/lib/room/RoomRpcClient.js";

describe("RoomRpcClient", () => {
    it("creates a unique UUID for each request", async () => {
        const sentRequests: Array<{ requestId: string }> = [];
        const client = new RoomRpcClient((request) => {
            sentRequests.push(request);
        }, "test scope");

        const firstPromise = client.request("getRoomLink", undefined, 1000);
        const secondPromise = client.request("getRoomLink", undefined, 1000);
        const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

        expect(sentRequests[0].requestId).toMatch(uuidV4Pattern);
        expect(sentRequests[1].requestId).toMatch(uuidV4Pattern);
        expect(sentRequests[0].requestId).not.toBe(sentRequests[1].requestId);

        client.rejectAll(new Error("test complete"));
        await expect(firstPromise).rejects.toThrow("test complete");
        await expect(secondPromise).rejects.toThrow("test complete");
    });

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
