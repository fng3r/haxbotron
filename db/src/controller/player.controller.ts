import type { Context } from "koa";
import type { PlayerModel } from "../model/PlayerModel.js";
import { playerModelSchema } from "../model/Validator.js";
import type { IPlayerRepository } from "../repository/player.repository.js";

export class PlayerController {
    private readonly _repository: IPlayerRepository;

    constructor(repository: IPlayerRepository) {
        this._repository = repository;
    }

    public async getAllPlayers(ctx: Context) {
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

    public async search(ctx: Context) {
        const { ruid } = ctx.params;
        const { searchQuery, start, count } = ctx.request.query;

        return this._repository
            .search(ruid, searchQuery as string, { start: parseInt(<string>start), count: parseInt(<string>count) })
            .then((players) => {
                ctx.status = 200;
                ctx.body = players;
            })
            .catch((error) => {
                console.error(error)
                ctx.status = 500;
                ctx.body = { error: error.message };
            });
    }

    public async getPlayer(ctx: Context) {
        const { ruid, auth } = ctx.params;

        return this._repository
            .findSingle(ruid, auth)
            .then((player) => {
                ctx.status = 200;
                ctx.body = player;
            })
            .catch((error) => {
                ctx.status = 404;
                ctx.body = { error: error.message };
            });
    }

    public async addPlayer(ctx: Context) {
        const validationResult = playerModelSchema.validate(ctx.request.body);

        if (validationResult.error) {
            ctx.status = 400;
            ctx.body = validationResult.error;
            return;
        }

        const { ruid } = ctx.params;
        const playerModel = validationResult.value as PlayerModel;

        return this._repository
            .addSingle(ruid, playerModel)
            .then(() => {
                ctx.status = 204;
            })
            .catch((error) => {
                ctx.status = 400;
                ctx.body = { error: error.message };
            });
    }

    public async updatePlayer(ctx: Context) {
        const validationResult = playerModelSchema.validate(ctx.request.body);

        if (validationResult.error) {
            ctx.status = 400;
            ctx.body = validationResult.error;
            return;
        }

        const { ruid, auth } = ctx.params;
        const playerModel = validationResult.value as PlayerModel;

        return this._repository
            .updateSingle(ruid, auth, playerModel)
            .then(() => {
                ctx.status = 204;
            })
            .catch((error) => {
                ctx.status = 404;
                ctx.body = { error: error.message };
            });
    }

    public async deletePlayer(ctx: Context) {
        const { ruid, auth } = ctx.params;

        return this._repository
            .deleteSingle(ruid, auth)
            .then(() => {
                ctx.status = 204;
            })
            .catch((error) => {
                ctx.status = 404;
                ctx.body = { error: error.message };
            });
    }
}
