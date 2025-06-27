import Router from "koa-router";
import * as playerlistController from '../../../controller/api/v1/playerlist';

export const playerlistRouter = new Router();

playerlistRouter.get('/:ruid', playerlistController.getAllList); // get all exist playerlist from DB server
playerlistRouter.get('/:ruid/:auth', playerlistController.getPlayerInfo); // get player info from DB server