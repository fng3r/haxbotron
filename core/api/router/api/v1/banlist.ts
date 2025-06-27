import Router from "koa-router";
import * as banlistController from '../../../controller/api/v1/banlist';

export const banlistRouter = new Router();

banlistRouter.get('/:ruid', banlistController.getAllList); // get all exist banlist from DB server
banlistRouter.get('/:ruid/:conn', banlistController.getBanInfo); // get ban info from DB server
banlistRouter.post('/:ruid', banlistController.banPlayer); // register new ban to DB server
banlistRouter.delete('/:ruid/:conn', banlistController.unbanPlayer); // delete ban from DB server
