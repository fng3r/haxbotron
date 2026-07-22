import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { SignJWT } from "jose";
import type { Socket } from "socket.io";
import { createWsAuthenticationMiddleware } from "../../../src/api/middleware/wsAuthenticationMiddleware.js";

const TEST_SECRET = "websocket-test-secret";
let wsAuthenticationMiddleware: ReturnType<typeof createWsAuthenticationMiddleware>;

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
        process.env.JWT_SECRET = TEST_SECRET;
        wsAuthenticationMiddleware = createWsAuthenticationMiddleware();
        jest.spyOn(console, "error").mockImplementation(() => undefined);
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });

    it.each([undefined, "", "   "])("rejects invalid JWT configuration (%p)", (jwtSecret) => {
        const previousSecret = process.env.JWT_SECRET;

        try {
            if (jwtSecret === undefined) {
                delete process.env.JWT_SECRET;
            } else {
                process.env.JWT_SECRET = jwtSecret;
            }

            expect(() => createWsAuthenticationMiddleware()).toThrow(
                "JWT_SECRET environment variable must be a non-empty string"
            );
        } finally {
            if (previousSecret === undefined) {
                delete process.env.JWT_SECRET;
            } else {
                process.env.JWT_SECRET = previousSecret;
            }
        }
    });

    it("accepts a valid JWT", async () => {
        const token = await new SignJWT({ sub: "test-user" })
            .setProtectedHeader({ alg: "HS256" })
            .sign(new TextEncoder().encode(TEST_SECRET));
        const { socket, disconnect } = createSocket(`access_token=${token}`);
        const next = jest.fn();

        await wsAuthenticationMiddleware(socket, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(disconnect).not.toHaveBeenCalled();
    });

    it("disconnects a socket without cookies", async () => {
        const { socket, disconnect } = createSocket();
        const next = jest.fn();

        await wsAuthenticationMiddleware(socket, next);

        expect(disconnect).toHaveBeenCalledTimes(1);
        expect(next).not.toHaveBeenCalled();
    });

    it("disconnects a socket without an access token", async () => {
        const { socket, disconnect } = createSocket("another_cookie=value");
        const next = jest.fn();

        await wsAuthenticationMiddleware(socket, next);

        expect(disconnect).toHaveBeenCalledTimes(1);
        expect(next).not.toHaveBeenCalled();
    });

    it("disconnects a socket with a malformed JWT", async () => {
        const { socket, disconnect } = createSocket("access_token=not-a-jwt");
        const next = jest.fn();

        await wsAuthenticationMiddleware(socket, next);

        expect(disconnect).toHaveBeenCalledTimes(1);
        expect(next).not.toHaveBeenCalled();
    });

    it("disconnects a socket with an expired JWT", async () => {
        const token = await new SignJWT({ sub: "test-user" })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime(Math.floor(Date.now() / 1000) - 1)
            .sign(new TextEncoder().encode(TEST_SECRET));
        const { socket, disconnect } = createSocket(`access_token=${token}`);
        const next = jest.fn();

        await wsAuthenticationMiddleware(socket, next);

        expect(disconnect).toHaveBeenCalledTimes(1);
        expect(next).not.toHaveBeenCalled();
    });
});
