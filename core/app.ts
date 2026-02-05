// ========================================================
// Haxbotron Headless Host Server for Haxball by dapucita
// https://github.com/dapucita/haxbotron
// ========================================================
import "dotenv/config";
import Koa from "koa";
import Router from "koa-router";
import bodyParser from "koa-bodyparser";
import logger from "koa-logger";
import nodeStorage from "node-persist";
import { createServer as HTTPcreateServer } from "http";
import { Server as SIOserver, Socket as SIOsocket } from "socket.io";
import { winstonLogger } from "./winstonLoggerSystem";
import { indexAPIRouter } from "./api/router/v1";
import { authenticationMiddleware } from "./api/middleware/authenticationMiddleware";
import { wsAuthenticationMiddleware } from "./api/middleware/wsAuthenticationMiddleware";
import { errorHandler } from "./api/middleware/errorHandler";
import { HeadlessBrowser } from "./lib/browser";
import { getServerConfig, getApiKeys } from "./lib/config";

const app = new Koa();
const router = new Router();
const server = HTTPcreateServer(app.callback());

const sio = new SIOserver(server, { path:'/ws', transports: ['websocket'] }); // socket.io server
const browser = HeadlessBrowser.getInstance(); // puppeteer wrapper instance

const coreServerSettings = getServerConfig();
const allowedApiKeys = getApiKeys();

nodeStorage.init();
browser.attachSIOserver(sio);

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

server
    .listen(coreServerSettings.port, async () => {
        console.log("_|    _|                      _|                    _|                                  "+"\n"+
                    "_|    _|    _|_|_|  _|    _|  _|_|_|      _|_|    _|_|_|_|  _|  _|_|    _|_|    _|_|_|  "+"\n"+
                    "_|_|_|_|  _|    _|    _|_|    _|    _|  _|    _|    _|      _|_|      _|    _|  _|    _|"+"\n"+
                    "_|    _|  _|    _|  _|    _|  _|    _|  _|    _|    _|      _|        _|    _|  _|    _|"+"\n"+
                    "_|    _|    _|_|_|  _|    _|  _|_|_|      _|_|        _|_|  _|          _|_|    _|    _|");
        console.log(`Haxbotron by dapucita (Visit our GitHub : https://github.com/dapucita/haxbotron)`);
        winstonLogger.info(`[core] Haxbotron core server is opened at ${coreServerSettings.port} port.`);
    });
