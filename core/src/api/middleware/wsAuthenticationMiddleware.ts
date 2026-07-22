import { ExtendedError, Socket } from "socket.io";
import { winstonLogger } from "../../winstonLoggerSystem.js";

/**
 * JWT validation middleware for Socket.IO Websocket
 */
export async function wsAuthenticationMiddleware(socket: Socket, next: (error?: ExtendedError) => void) {
    const cookie = socket.request.headers.cookie;
    
    if (!cookie) {
        winstonLogger.error('[api] [ws] WebSocket connection rejected: No cookies provided');
        socket.disconnect();
        return;
    }

    try {
        // cookie and jose are ESM-only. Keep this boundary dynamic while core emits CommonJS.
        const [{ parseCookie }, { jwtVerify }] = await Promise.all([import("cookie"), import("jose")]);
        const tokenCookie = parseCookie(cookie);
        const token = tokenCookie['access_token'];
        
        if (!token) {
            winstonLogger.error('[api] [ws] WebSocket connection rejected: No access_token in cookies');
            socket.disconnect();
            return;
        }

        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        await jwtVerify(token, secretKey, {
            algorithms: ['HS256'],
        });
    } catch (error: any) {
        winstonLogger.error(`[api] [ws] JWT verification failed: ${error.message}`);
        socket.disconnect();
        return;
    }

    return next();
}
