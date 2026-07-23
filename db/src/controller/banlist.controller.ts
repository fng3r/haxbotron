import type { Context } from "koa";
import type { BanList } from "../entity/banlist.entity.js";
import type { BanListModel } from "../model/BanListModel.js";
import { banListModelSchema } from "../model/Validator.js";
import type { IRepository } from "../repository/repository.interface.js";

export class BanListController {
    private readonly _repository: IRepository<BanList>;

    constructor(repository: IRepository<BanList>) {
        this._repository = repository;
    }

    public async getAllBannedPlayers(ctx: Context) {
        const { ruid } = ctx.params;
        const { start, count } = ctx.request.query;

        if (start && count) {
            return this._repository
                .findAll(ruid, { start: parseInt(<string>start), count: parseInt(<string>count) })
                .then((players) => {
                    ctx.status = 200;
                    ctx.body = players;
                })
                .catch((error) => {
                    ctx.status = 404;
                    ctx.body = { error: error.message };
                });
        } else {
            return this._repository
                .findAll(ruid)
                .then((players) => {
                    ctx.status = 200;
                    ctx.body = players;
                })
                .catch((error) => {
                    ctx.status = 404;
                    ctx.body = { error: error.message };
                });
        }
    }

    public async getBannedPlayer(ctx: Context) {
        const { ruid, conn } = ctx.params;

        return this._repository
            .findSingle(ruid, conn)
            .then((player) => {
                ctx.status = 200;
                ctx.body = player;
            })
            .catch((error) => {
                ctx.status = 404;
                ctx.body = { error: error.message };
            });
    }

    public async addBanPlayer(ctx: Context) {
        const validationResult = banListModelSchema.validate(ctx.request.body);

        if (validationResult.error) {
            ctx.status = 400;
            ctx.body = validationResult.error;
            return;
        }

        const { ruid } = ctx.params;
        const banlistModel = validationResult.value as BanListModel;

        return this._repository
            .addSingle(ruid, banlistModel)
            .then(() => {
                ctx.status = 204;
            })
            .catch((error) => {
                ctx.status = 400;
                ctx.body = { error: error.message };
            });
    }

    public async updateBannedPlayer(ctx: Context) {
        const validationResult = banListModelSchema.validate(ctx.request.body);

        if (validationResult.error) {
            ctx.status = 400;
            ctx.body = validationResult.error;
            return;
        }

        const { ruid, conn } = ctx.params;
        const banlistModel = validationResult.value as BanListModel;

        return this._repository
            .updateSingle(ruid, conn, banlistModel)
            .then(() => {
                ctx.status = 204;
            })
            .catch((error) => {
                ctx.status = 404;
                ctx.body = { error: error.message };
            });
    }

    public async deleteBannedPlayer(ctx: Context) {
        const { ruid, conn } = ctx.params;

        return this._repository
            .deleteSingle(ruid, conn)
            .then(() => {
                ctx.status = 204;
            })
            .catch((error) => {
                ctx.status = 404;
                ctx.body = { error: error.message };
            });
    }
}
