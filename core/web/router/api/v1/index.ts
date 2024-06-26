import Router from "koa-router";
import cors from "@koa/cors";
import { authRouter } from "./auth";
import { roomRouter } from "./room";
import { initRouter } from "./init";
import { systemRouter } from "./system";
import { ruidlistRouter } from "./ruidlist";
import { banlistRouter } from "./banlist";
import { playerlistRouter } from "./playerlist";
import { playerRolesRouter} from "./playerroles";

export const indexAPIRouter = new Router();

indexAPIRouter
    .use(cors({
            origin: process.env.CLIENT_HOST,
            credentials: true,
        }))
    .use('/room', roomRouter.routes())
    .use('/auth', authRouter.routes())
    .use('/init', initRouter.routes())
    .use('/ruidlist', ruidlistRouter.routes())
    .use('/banlist', banlistRouter.routes())
    .use('/roleslist', playerRolesRouter.routes())
    .use('/playerlist', playerlistRouter.routes())
    .use('/system', systemRouter.routes());
