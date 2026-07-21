import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Socket } from "socket.io";
import { wsAuthenticationMiddleware } from "../../../api/middleware/wsAuthenticationMiddleware";

function createSocket(cookie?: string): { socket: Socket; disconnect: jest.Mock } {
    const disconnect = jest.fn();
    const socket = {
        request: { headers: { cookie } },
        disconnect,
    } as unknown as Socket;

    return { socket, disconnect };
}

describe("WebSocket authentication middleware", () => {
    beforeEach(() => {
        process.env.JWT_SECRET = "websocket-test-secret";
        jest.spyOn(console, "error").mockImplementation(() => undefined);
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });

    it("accepts a valid JWT through the ESM-only jose boundary", async () => {
        const { SignJWT } = await import("jose");
        const token = await new SignJWT({ sub: "test-user" })
            .setProtectedHeader({ alg: "HS256" })
            .sign(new TextEncoder().encode(process.env.JWT_SECRET));
        const { socket, disconnect } = createSocket(`access_token=${token}`);
        const next = jest.fn();

        await wsAuthenticationMiddleware(socket, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(disconnect).not.toHaveBeenCalled();
    });

    it("disconnects a socket without an access token", async () => {
        const { socket, disconnect } = createSocket("another_cookie=value");
        const next = jest.fn();

        await wsAuthenticationMiddleware(socket, next);

        expect(disconnect).toHaveBeenCalledTimes(1);
        expect(next).not.toHaveBeenCalled();
    });
});
