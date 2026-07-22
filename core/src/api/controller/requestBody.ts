import { Context } from "koa";

/**
 * Read an untrusted request body as an object with optional fields.
 * Callers must still validate every field before using it.
 */
export function getRequestBody<T extends object>(ctx: Context): Partial<T> {
    const body = ctx.request.body;
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
        return {};
    }

    return body as Partial<T>;
}
