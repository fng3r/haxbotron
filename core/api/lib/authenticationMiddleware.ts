import { Context, Next } from "koa";

const API_KEY_HEADER = 'x-api-key';

/**
 * API key validation middleware for Koa
 */
export function authenticationMiddleware(apiKeys: string[]) {
    return async (ctx: Context, next: Next) => {
        const apiKey = ctx.get(API_KEY_HEADER);
        if (!apiKey) {
            ctx.throw(401, 'Api key is not provided');
        }
        if (!apiKeys.includes(apiKey)) {
            ctx.throw(401, 'Invalid api key');
        }

        return next();
    };  
}
