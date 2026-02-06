// ========================================================
// Haxbotron Headless Host Server for Haxball by dapucita
// https://github.com/dapucita/haxbotron
// ========================================================
import "dotenv/config";
import { createServer as HTTPcreateServer } from "http";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import logger from "koa-logger";
import Router from "koa-router";
import nodeStorage from "node-persist";
import { Server as SIOserver, Socket as SIOsocket } from "socket.io";
import { authenticationMiddleware } from "./api/middleware/authenticationMiddleware";
import { errorHandler } from "./api/middleware/errorHandler";
import { wsAuthenticationMiddleware } from "./api/middleware/wsAuthenticationMiddleware";
import { indexAPIRouter } from "./api/router/v1";
import { createBrowserServices } from "./lib/browser/";
import { getApiKeys, getServerConfig } from "./lib/config";
import { winstonLogger } from "./winstonLoggerSystem";

const app = new Koa();
const router = new Router();
const server = HTTPcreateServer(app.callback());

const sio = new SIOserver(server, { path:'/ws', transports: ['websocket'] });

const coreServerSettings = getServerConfig();
const allowedApiKeys = getApiKeys();

nodeStorage.init();

// ========================================================
router
    .use('/api/v1', indexAPIRouter.routes());

app
    .use(errorHandler)
    .use(logger())
    .use(bodyParser())
    .use(authenticationMiddleware(allowedApiKeys))
    .use(router.routes())
    .use(router.allowedMethods());

sio.on('connection', (socket: SIOsocket) => {

})
sio.use(wsAuthenticationMiddleware);

// Start server after browser services are initialized
(async () => {
    // Initialize browser services first
    const { browserManager } = await createBrowserServices();
    browserManager.attachSocketIOServer(sio);
    winstonLogger.info('[core] Browser services initialized');

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
