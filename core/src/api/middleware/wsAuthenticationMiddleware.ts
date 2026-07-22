import { parseCookie } from "cookie";
import { jwtVerify } from "jose";
import type { ExtendedError, Socket } from "socket.io";
import { getJwtSecret } from "../../lib/config.js";
import { winstonLogger } from "../../winstonLoggerSystem.js";

const JWT_ALGORITHMS = ["HS256"];

/**
 * JWT validation middleware for Socket.IO Websocket
 */
export function createWsAuthenticationMiddleware() {
    const verificationKey = new TextEncoder().encode(getJwtSecret());

    return async (socket: Socket, next: (error?: ExtendedError) => void) => {
        const cookie = socket.request.headers.cookie;

        if (!cookie) {
            winstonLogger.error('[api] [ws] WebSocket connection rejected: No cookies provided');
            socket.disconnect();
            return;
        }

        try {
            const tokenCookie = parseCookie(cookie);
            const token = tokenCookie['access_token'];

            if (!token) {
                winstonLogger.error('[api] [ws] WebSocket connection rejected: No access_token in cookies');
                socket.disconnect();
                return;
            }

            await jwtVerify(token, verificationKey, {
                algorithms: JWT_ALGORITHMS,
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            winstonLogger.error(`[api] [ws] JWT verification failed: ${message}`);
            socket.disconnect();
            return;
        }

        return next();
    };
}
