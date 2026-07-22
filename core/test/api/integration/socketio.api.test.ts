import { createServer, Server as HttpServer } from "node:http";
import { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "@jest/globals";
import { SignJWT } from "jose";
import { Server as SocketIOServer } from "socket.io";
import { io as createSocketIOClient, Socket as SocketIOClient } from "socket.io-client";
import { createWsAuthenticationMiddleware } from "../../../src/api/middleware/wsAuthenticationMiddleware.js";

describe("Socket.IO authentication", () => {
    let httpServer: HttpServer | undefined;
    let socketServer: SocketIOServer | undefined;
    let client: SocketIOClient | undefined;

    afterEach(async () => {
        client?.disconnect();

        if (socketServer) {
            await new Promise<void>((resolve) => socketServer?.close(() => resolve()));
        }

        if (httpServer?.listening) {
            await new Promise<void>((resolve, reject) => {
                httpServer?.close((error) => error ? reject(error) : resolve());
            });
        }
    });

    it("accepts an authenticated Socket.IO v4 WebSocket client", async () => {
        const jwtSecret = "socketio-integration-secret";
        process.env.JWT_SECRET = jwtSecret;
        const token = await new SignJWT({ sub: "socketio-test-user" })
            .setProtectedHeader({ alg: "HS256" })
            .sign(new TextEncoder().encode(jwtSecret));

        httpServer = createServer();
        socketServer = new SocketIOServer(httpServer, {
            path: "/ws",
            transports: ["websocket"],
        });
        socketServer.use(createWsAuthenticationMiddleware());

        await new Promise<void>((resolve) => httpServer?.listen(0, "127.0.0.1", resolve));
        const { port } = httpServer.address() as AddressInfo;

        client = createSocketIOClient(`http://127.0.0.1:${port}`, {
            path: "/ws",
            transports: ["websocket"],
            extraHeaders: {
                Cookie: `access_token=${token}`,
            },
            forceNew: true,
            reconnection: false,
        });

        await new Promise<void>((resolve, reject) => {
            client?.once("connect", resolve);
            client?.once("connect_error", reject);
        });

        expect(client.connected).toBe(true);
    });
});
