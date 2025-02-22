import Router from "koa-router";
import { Context } from "koa";
import { PlayerController } from '../controller/player.controller';
import { IPlayerRepository, PlayerRepository } from '../repository/player.repository';

export const playerRouter = new Router();
const playersRepository: IPlayerRepository = new PlayerRepository();
const controller: PlayerController = new PlayerController(playersRepository);

// /v1/player GET
// get all players list and data
playerRouter.get('/', async (ctx: Context) => {
    await controller.getAllPlayers(ctx);
});

// /v1/player/search GET
// search players
playerRouter.get('/search', async (ctx: Context) => {
    await controller.search(ctx)
});

// /v1/player POST
// register new player
playerRouter.post('/', async (ctx: Context) => {
    await controller.addPlayer(ctx)
});

// /v1/player/:auth GET
// get the player data
playerRouter.get('/:auth', async (ctx: Context) => {
    await controller.getPlayer(ctx)
});

// /v1/player/:auth PUT
// update whole data of the player
playerRouter.put('/:auth', async (ctx: Context) => {
    await controller.updatePlayer(ctx)
});

// /v1/player/:auth DELETE
// delete the player
playerRouter.delete('/:auth', async (ctx: Context) => {
    await controller.deletePlayer(ctx)
});
