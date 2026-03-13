import Router from "koa-router";
import cors from "@koa/cors";
import { RoomOperationsAPI } from "../../../lib/room";
import { createRoomRouter } from "./room";
import { systemRouter } from "./system";
import { ruidlistRouter } from "./ruidlist";
import { banlistRouter } from "./banlist";
import { playerlistRouter } from "./playerlist";
import { playerRolesRouter} from "./playerroles";

export function createIndexAPIRouter(roomOperations: RoomOperationsAPI): Router {
    const indexAPIRouter = new Router();
    const roomRouter = createRoomRouter(roomOperations);

    indexAPIRouter
        .use(
            cors({
                origin: process.env.CLIENT_HOST,
                credentials: true,
            })
        )
        .use('/room', roomRouter.routes())
        .use('/ruidlist', ruidlistRouter.routes())
        .use('/banlist', banlistRouter.routes())
        .use('/roleslist', playerRolesRouter.routes())
        .use('/playerlist', playerlistRouter.routes())
        .use('/system', systemRouter.routes());

    return indexAPIRouter;
}
