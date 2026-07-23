import type { Context } from "koa";
import { RoomConfigRepository } from "../repository/roomConfig.repository.js";

export class RoomConfigController {
    public constructor(private readonly repository = new RoomConfigRepository()) {}

    public async list(ctx: Context): Promise<void> {
        ctx.body = (await this.repository.findAll()).map((row) => ({
            ...row.config,
            ruid: row.ruid,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        }));
    }

    public async get(ctx: Context): Promise<void> {
        const row = await this.repository.findOne(ctx.params.ruid);
        if (!row) {
            ctx.status = 404;
            ctx.body = { error: "Room configuration not found." };
            return;
        }
        ctx.body = { ...row.config, ruid: row.ruid, createdAt: row.createdAt, updatedAt: row.updatedAt };
    }

    public async put(ctx: Context): Promise<void> {
        const body = ctx.request.body;
        if (!body || typeof body !== "object" || Array.isArray(body)) {
            ctx.status = 400;
            ctx.body = { error: "Configuration must be an object." };
            return;
        }
        const config = { ...(body as Record<string, unknown>), ruid: ctx.params.ruid };
        const existed = await this.repository.findOne(ctx.params.ruid);
        const row = await this.repository.upsert(ctx.params.ruid, config);
        ctx.status = existed ? 200 : 201;
        ctx.body = { ...row.config, ruid: row.ruid, createdAt: row.createdAt, updatedAt: row.updatedAt };
    }

    public async delete(ctx: Context): Promise<void> {
        if (!(await this.repository.delete(ctx.params.ruid))) {
            ctx.status = 404;
            ctx.body = { error: "Room configuration not found." };
            return;
        }
        ctx.status = 204;
    }
}
