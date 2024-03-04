import Router from "koa-router";
import * as playerRolesController from '../../../controller/api/v1/playerrolelist';
import { checkLoginMiddleware } from "../../../lib/logincheck.middleware";

export const playerRolesRouter = new Router();

playerRolesRouter.get('/', checkLoginMiddleware, playerRolesController.getAllList);
playerRolesRouter.post('/:auth', checkLoginMiddleware, playerRolesController.addPlayerRole);
playerRolesRouter.put('/:auth', checkLoginMiddleware, playerRolesController.updatePlayerRole)
playerRolesRouter.delete('/:auth', checkLoginMiddleware, playerRolesController.deletePlayerRole);