import Router from "@koa/router";
import cors from "@koa/cors";
import { RoomOperationsAPI } from "../../../lib/room/index.js";
import { createRoomRouter } from "./room.js";
import { systemRouter } from "./system.js";
import { ruidlistRouter } from "./ruidlist.js";
import { banlistRouter } from "./banlist.js";
import { playerlistRouter } from "./playerlist.js";
import { playerRolesRouter} from "./playerroles.js";

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
