// ========================================================
// Haxbotron Headless Host Server for Haxball by dapucita
// https://github.com/dapucita/haxbotron
// ========================================================
import bodyParser from "@koa/bodyparser";
import Router from "@koa/router";
import "dotenv/config";
import Koa from "koa";
import logger from "koa-logger";
import { createServer as HTTPcreateServer } from "node:http";
import { Server as SIOserver } from "socket.io";
import { authenticationMiddleware } from "./api/middleware/authenticationMiddleware.js";
import { errorHandler } from "./api/middleware/errorHandler.js";
import { createWsAuthenticationMiddleware } from "./api/middleware/wsAuthenticationMiddleware.js";
import { createIndexAPIRouter } from "./api/router/v1/index.js";
import { getApiKeys, getServerConfig } from "./lib/config.js";
import { createRoomServices } from "./lib/room/index.js";
import { winstonLogger } from "./winstonLoggerSystem.js";

const app = new Koa();
const router = new Router();
const server = HTTPcreateServer(app.callback());

const sio = new SIOserver(server, { path:'/ws', transports: ['websocket'] });

const coreServerSettings = getServerConfig();
const allowedApiKeys = getApiKeys();

sio.use(createWsAuthenticationMiddleware());

// Start server after room services are initialized
(async () => {
    const { roomProcessManager, roomOperations } = createRoomServices();
    const indexAPIRouter = createIndexAPIRouter(roomOperations);

    router.use('/api/v1', indexAPIRouter.routes());

    app
        .use(errorHandler)
        .use(logger())
        .use(bodyParser())
        .use(authenticationMiddleware(allowedApiKeys))
        .use(router.routes())
        .use(router.allowedMethods());

    roomProcessManager.attachSocketIOServer(sio);
    winstonLogger.info("[core] Room services initialized");

    // Now start the server
    server.listen(coreServerSettings.port, () => {
        console.log("_|    _|                      _|                    _|                                  "+"\n"+
                    "_|    _|    _|_|_|  _|    _|  _|_|_|      _|_|    _|_|_|_|  _|  _|_|    _|_|    _|_|_|  "+"\n"+
                    "_|_|_|_|  _|    _|    _|_|    _|    _|  _|    _|    _|      _|_|      _|    _|  _|    _|"+"\n"+
                    "_|    _|  _|    _|  _|    _|  _|    _|  _|    _|    _|      _|        _|    _|  _|    _|"+"\n"+
                    "_|    _|    _|_|_|  _|    _|  _|_|_|      _|_|        _|_|  _|          _|_|    _|    _|");
        console.log(`Haxbotron by dapucita (Visit our GitHub : https://github.com/dapucita/haxbotron)`);
        winstonLogger.info(`[core] Haxbotron core server is opened at ${coreServerSettings.port} port.`);
    });
})();
