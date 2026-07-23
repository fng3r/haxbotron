import axios from "axios";
import type { Context } from "koa";
import { apiDbAdapter } from "../../../lib/db/adapters/ApiDbAdapter.js";
import { ExternalServiceError, NotFoundError, ValidationError } from "../../../lib/errors.js";
import { formatJoiError } from "../../middleware/errorHandler.js";
import { nestedHostRoomConfigSchema } from "../../schema/hostroomconfig.validation.js";

function rethrow(error: unknown, ruid?: string): never {
    if (axios.isAxiosError(error) && error.response?.status === 404) throw new NotFoundError("Room configuration", ruid);
    if (axios.isAxiosError(error)) throw new ExternalServiceError("Database", error.message, { status: error.response?.status });
    throw error;
}

export async function list(ctx: Context): Promise<void> {
    try { ctx.body = await apiDbAdapter.getRoomConfigs(); } catch (error) { rethrow(error); }
}

export async function get(ctx: Context): Promise<void> {
    try { ctx.body = await apiDbAdapter.getRoomConfig(ctx.params.ruid); } catch (error) { rethrow(error, ctx.params.ruid); }
}

export async function put(ctx: Context): Promise<void> {
    const result = nestedHostRoomConfigSchema.validate({ ...(ctx.request.body as object), ruid: ctx.params.ruid });
    if (result.error) {
        const formatted = formatJoiError(result.error);
        throw new ValidationError(formatted.message, formatted.details);
    }
    try {
        ctx.body = await apiDbAdapter.saveRoomConfig(result.value);
        ctx.status = 200;
    } catch (error) { rethrow(error, ctx.params.ruid); }
}

export async function remove(ctx: Context): Promise<void> {
    try {
        await apiDbAdapter.deleteRoomConfig(ctx.params.ruid);
        ctx.status = 204;
    } catch (error) { rethrow(error, ctx.params.ruid); }
}
