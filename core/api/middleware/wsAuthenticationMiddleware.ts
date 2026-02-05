import { parse as parseCookie } from "cookie";
import { jwtVerify } from "jose";
import { Socket } from "socket.io";

/**
 * JWT validation middleware for Socket.IO Websocket
 */
export async function wsAuthenticationMiddleware(socket: Socket, next: any) {
    const cookie = socket.request.headers.cookie;
    
    if (!cookie) {
        console.error('WebSocket connection rejected: No cookies provided');
        socket.disconnect();
        return;
    }

    try {
        const tokenCookie = parseCookie(cookie);
        const token = tokenCookie['access_token'];
        
        if (!token) {
            console.error('WebSocket connection rejected: No access_token in cookies');
            socket.disconnect();
            return;
        }

        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        await jwtVerify(token, secretKey, {
            algorithms: ['HS256'],
        });
    } catch (error: any) {
        console.error('JWT verification failed:', error.message);
        socket.disconnect();
        return;
    }

    console.log('WebSocket authentication successful');
    return next();
}
