import Router from "@koa/router";
import cors from "@koa/cors";
import { playerRouter } from "./v1.player.router.js";
import { playerRoleRouter } from "./v1.playerrole.router.js";
import { banlistRouter } from "./v1.banlist.router.js";
import { ruidlistRouter } from "./v1.ruidlist.router.js";
import { roomConfigRouter } from "./v1.roomconfig.router.js";

export const apiRouterV1 = new Router();

apiRouterV1
    .use(cors({
            origin: process.env.CLIENT_HOST, // Access-Control-Allow-Origin
            credentials: true, // Access-Control-Allow-Credentials
        }))
    .use('/ruidlist', ruidlistRouter.routes())
    .use('/room-configs', roomConfigRouter.routes())
    .use('/room/:ruid/player', playerRouter.routes())
    .use('/player-roles', playerRoleRouter.routes())
    .use('/room/:ruid/banlist', banlistRouter.routes())
