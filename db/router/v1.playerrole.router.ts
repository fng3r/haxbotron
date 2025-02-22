import Router from "koa-router";
import { Context } from "koa";
import { PlayerRoleController } from '../controller/playerrole.controller';
import {IPlayerRoleRepository, PlayerRoleRepository} from '../repository/playerRole.repository';

export const playerRoleRouter = new Router();
const playersRepository: IPlayerRoleRepository = new PlayerRoleRepository();
const controller: PlayerRoleController = new PlayerRoleController(playersRepository);

// /v1/player-roles/ GET
// get player roles
playerRoleRouter.get('/', async (ctx: Context) => {
    await controller.getAll(ctx)
});

// /v1/player-roles/search GET
// search player roles
playerRoleRouter.get('/search', async (ctx: Context) => {
    await controller.search(ctx)
});

// /v1/player-roles/events GET
// search player role events
playerRoleRouter.get('/events', async (ctx: Context) => {
    await controller.searchEvents(ctx)
});

// /v1/player-roles/:auth GET
// get the player data
playerRoleRouter.get('/:auth', async (ctx: Context) => {
    await controller.getPlayerRole(ctx)
});

// /v1/player-roles/:auth POST
// update whole data of the player
playerRoleRouter.post('/:auth', async (ctx: Context) => {
    await controller.addPlayerRole(ctx)
});

// /v1/player-roles/:auth PUT
// update whole data of the player
playerRoleRouter.put('/:auth', async (ctx: Context) => {
    await controller.updatePlayerRole(ctx)
});

// /v1/player-roles/:auth DELETE
// delete the player
playerRoleRouter.delete('/:auth', async (ctx: Context) => {
    await controller.deletePlayerRole(ctx)
});