import Router from "koa-router";
import * as ruidlistController from '../../../controller/api/v1/ruidlist';

export const ruidlistRouter = new Router();

ruidlistRouter.get('/', ruidlistController.getAllList); // get all exist RUIDs list on DB server
