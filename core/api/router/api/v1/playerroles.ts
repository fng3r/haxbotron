import Router from "koa-router";
import * as playerRolesController from '../../../controller/api/v1/playerrolelist';

export const playerRolesRouter = new Router();

playerRolesRouter.get('/', playerRolesController.getAllList);
playerRolesRouter.post('/:auth', playerRolesController.addPlayerRole);
playerRolesRouter.put('/:auth', playerRolesController.updatePlayerRole)
playerRolesRouter.delete('/:auth', playerRolesController.deletePlayerRole);
playerRolesRouter.get('/events', playerRolesController.getEventsList);