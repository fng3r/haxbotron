import { Context, Next } from "koa";
import { AuthenticationError } from "../../lib/errors";

const API_KEY_HEADER = 'x-api-key';

/**
 * API key validation middleware for Koa
 */
export function authenticationMiddleware(apiKeys: string[]) {
    return async (ctx: Context, next: Next) => {
        const apiKey = ctx.get(API_KEY_HEADER);
        if (!apiKey) {
            throw new AuthenticationError('API key is required');
        }
        if (!apiKeys.includes(apiKey)) {
            throw new AuthenticationError('Invalid API key');
        }

        return next();
    };  
}
