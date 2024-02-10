import { Context } from "koa";
import { IPlayerRoleRepository } from '../repository/playerRole.repository';

export class PlayerRoleController {
    private readonly _repository: IPlayerRoleRepository;

    constructor(repository: IPlayerRoleRepository) {
        this._repository = repository;
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
        const {name, role} = ctx.query;

        return this._repository
            .create(auth, name as string, role as string)
            .then((player) => {
                ctx.status = 204;
            })
            .catch((error) => {
                console.error(error)
                ctx.status = 409;
                ctx.body = {error: error.message};
            });
    }

    public async updatePlayerRole(ctx: Context) {
        const {auth} = ctx.params;
        const {name, role} = ctx.query;

        return this._repository
            .set(auth, name as string, role as string)
            .then((player) => {
                ctx.status = 200;
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