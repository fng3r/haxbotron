import Router from "@koa/router";
import { RoomConfigController } from "../controller/roomConfig.controller.js";

export const roomConfigRouter = new Router();
const controller = new RoomConfigController();

roomConfigRouter.get("/", (ctx) => controller.list(ctx));
roomConfigRouter.get("/:ruid", (ctx) => controller.get(ctx));
roomConfigRouter.put("/:ruid", (ctx) => controller.put(ctx));
roomConfigRouter.delete("/:ruid", (ctx) => controller.delete(ctx));
