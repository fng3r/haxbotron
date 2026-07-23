import "reflect-metadata";
import "dotenv/config";
import bodyParser from "@koa/bodyparser";
import Router from "@koa/router";
import Koa from "koa";
import logger from "koa-logger";
import { appDataSource } from "./dataSource.js";
import { ipWhitelist } from "./middleware/ipWhitelist.js";
import { apiRouterV1 } from "./router/v1.api.router.js";
import { winstonLogger } from "./utility/winstonLoggerSystem.js";

const serverPort = Number.parseInt(process.env.SERVER_PORT ?? "13001", 10);
if (!Number.isInteger(serverPort) || serverPort < 0 || serverPort > 65_535) {
    throw new Error("SERVER_PORT must be an integer between 0 and 65535");
}

const whitelistIps = process.env.SERVER_WHITELIST_IP
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean) ?? ["127.0.0.1"];

async function start(): Promise<void> {
    await appDataSource.initialize();

    const app = new Koa();
    const router = new Router();
    router.use("/api/v1", apiRouterV1.routes());

    app
        .use(ipWhitelist(whitelistIps))
        .use(logger())
        .use(bodyParser())
        .use(router.routes())
        .use(router.allowedMethods());

    const server = app.listen(serverPort, () => {
        const address = server.address();
        const actualPort = typeof address === "object" && address ? address.port : serverPort;
        winstonLogger.info(`[db] Haxbotron DB server is opened at ${actualPort} port.`);
        winstonLogger.info(`[db] IP Whitelist : ${whitelistIps.join(",")}`);
    });

    let shuttingDown = false;
    const shutdown = (): void => {
        if (shuttingDown) return;
        shuttingDown = true;
        server.close(() => {
            void appDataSource.destroy().finally(() => process.exit(0));
        });
    };

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
}

console.log("_|    _|                      _|                    _|                                  " + "\n" +
    "_|    _|    _|_|_|  _|    _|  _|_|_|      _|_|    _|_|_|_|  _|  _|_|    _|_|    _|_|_|  " + "\n" +
    "_|_|_|_|  _|    _|    _|_|    _|    _|  _|    _|    _|      _|_|      _|    _|  _|    _|" + "\n" +
    "_|    _|  _|    _|  _|    _|  _|    _|  _|    _|    _|      _|        _|    _|  _|    _|" + "\n" +
    "_|    _|    _|_|_|  _|    _|  _|_|_|      _|_|        _|_|  _|          _|_|    _|    _|");
console.log("Haxbotron by dapucita (Visit our GitHub : https://github.com/dapucita/haxbotron)");
winstonLogger.info(`haxbotron-db server is launched at ${new Date().toLocaleString()}`);

void start().catch((error: unknown) => {
    winstonLogger.error(`[db] Failed to start server. Error: ${String(error)}`);
    process.exitCode = 1;
});
