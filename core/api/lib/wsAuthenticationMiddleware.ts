import { parse as parseCookie } from "cookie";
import { Socket } from "socket.io";
import { jwtVerify } from "jose";

/**
 * JWT validation middleware for Socket.IO Websocket
 */
export async function wsAuthenticationMiddleware(socket: Socket, next: any) {
    const cookie = socket.request.headers.cookie
    if (socket.request.headers.cookie) { // when http-only cookie exists
        const tokenCookie = parseCookie(cookie!);
        const token = tokenCookie['access_token'];
        if (!token) {
            socket.disconnect();
            return;
        }
        try {
            const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
            await jwtVerify(token, secretKey, {
              algorithms: ['HS256'],
            });

            return next();
          } catch (error: any) {
            console.error('JWT verification failed:', error.message);
            socket.disconnect();
          }
    }
}
