import type { Middleware } from "koa";

export function ipWhitelist(patterns: readonly string[]): Middleware {
    const allowedPatterns = patterns.map((pattern) => new RegExp(pattern));

    return async (context, next) => {
        if (!allowedPatterns.some((pattern) => pattern.test(context.ip))) {
            context.throw(403);
        }

        await next();
    };
}
