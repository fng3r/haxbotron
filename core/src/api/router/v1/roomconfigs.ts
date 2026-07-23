import Router from "@koa/router";
import * as controller from "../../controller/v1/roomconfigs.js";

export const roomConfigsRouter = new Router();
roomConfigsRouter.get("/", controller.list);
roomConfigsRouter.get("/:ruid", controller.get);
roomConfigsRouter.put("/:ruid", controller.put);
roomConfigsRouter.delete("/:ruid", controller.remove);
