import type { Context } from "koa";

export function getRequestBody(context: Context): Record<string, unknown> {
    const body = context.request.body;
    return typeof body === "object" && body !== null && !Array.isArray(body)
        ? body as Record<string, unknown>
        : {};
}
