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
import { indexAPIRouter } from "./web/router/api/v1";
import { jwtMiddleware, jwtMiddlewareWS } from "./web/lib/jwt.middleware";
import { HeadlessBrowser } from "./lib/browser";

const app = new Koa();
const router = new Router();
const server = HTTPcreateServer(app.callback());

const sio = new SIOserver(server, { path:'/ws', transports: ['websocket'] }); // socket.io server
const browser = HeadlessBrowser.getInstance(); // puppeteer wrapper instance

const coreServerSettings = {
    port: (process.env.SERVER_PORT ? parseInt(JSON.parse(process.env.SERVER_PORT)) : 12001)
    , level: (process.env.SERVER_LEVEL || 'common')
}
const whiteListIPs: string[] = process.env.SERVER_WHITELIST_IP?.split(",") || ['127.0.0.1'];

nodeStorage.init();
browser.attachSIOserver(sio);

// ========================================================
router
    .use('/api/v1', indexAPIRouter.routes());

app
    .use(logger())
    .use(bodyParser())
    .use(jwtMiddleware)
    .use(router.routes())
    .use(router.allowedMethods());

sio.on('connection', (socket: SIOsocket) => {

})
sio.use((socket, next) => jwtMiddlewareWS(socket, next));

server
    .listen(coreServerSettings.port, async () => {
        console.log("_|    _|                      _|                    _|                                  "+"\n"+
                    "_|    _|    _|_|_|  _|    _|  _|_|_|      _|_|    _|_|_|_|  _|  _|_|    _|_|    _|_|_|  "+"\n"+
                    "_|_|_|_|  _|    _|    _|_|    _|    _|  _|    _|    _|      _|_|      _|    _|  _|    _|"+"\n"+
                    "_|    _|  _|    _|  _|    _|  _|    _|  _|    _|    _|      _|        _|    _|  _|    _|"+"\n"+
                    "_|    _|    _|_|_|  _|    _|  _|_|_|      _|_|        _|_|  _|          _|_|    _|    _|");
        console.log(`Haxbotron by dapucita (Visit our GitHub : https://github.com/dapucita/haxbotron)`);
        winstonLogger.info(`[core] Haxbotron core server is opened at ${coreServerSettings.port} port.`);
        winstonLogger.info(`[core] IP Whitelist : ${whiteListIPs}`);
    });
