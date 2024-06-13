import { Context } from "koa";
import { IPlayerRoleRepository } from '../repository/playerRole.repository';

export class PlayerRoleController {
    private readonly _repository: IPlayerRoleRepository;

    constructor(repository: IPlayerRoleRepository) {
        this._repository = repository;
    }

    public async getAll(ctx: Context) {
        const { start, count } = ctx.request.query;

        if (start && count) {
            return this._repository
                .findAll({ start: parseInt(<string>start), count: parseInt(<string>count) })
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
                .findAll()
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
        const { searchQuery, start, count } = ctx.request.query;

        return this._repository
            .search(searchQuery as string, { start: parseInt(<string>start), count: parseInt(<string>count) })
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

    public async getPlayerRole(ctx: Context) {
        const {auth} = ctx.params;

        return this._repository
            .get(auth)
            .then((playerRole) => {
                ctx.status = 200;
                ctx.body = playerRole;
            })
            .catch((error) => {
                ctx.status = 404;
                ctx.body = {error: error.message};
            });
    }

    public async addPlayerRole(ctx: Context) {
        const {auth} = ctx.params;
        const {name, role} = ctx.request.body;

        return this._repository
            .create(auth, name, role)
            .then((player) => {
                ctx.status = 204;
            })
            .catch((error) => {
                console.error(error);
                ctx.status = 409;
                ctx.body = {error: error.message};
            });
    }

    public async updatePlayerRole(ctx: Context) {
        const {auth} = ctx.params;
        const {name, role} = ctx.request.body;

        return this._repository
            .set(auth, name, role)
            .then((player) => {
                ctx.status = 204;
                ctx.body = player;
            })
            .catch((error) => {
                ctx.status = 404;
                ctx.body = {error: error.message};
            });
    }

    public async deletePlayerRole(ctx: Context) {
        const {auth} = ctx.params;
        const {name} = ctx.query;

        return this._repository
            .delete(auth, name as string)
            .then((player) => {
                ctx.status = 200;
                ctx.body = player;
            })
            .catch((error) => {
                ctx.status = 404;
                ctx.body = {error: error.message};
            });
    }
}