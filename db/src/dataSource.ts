import "dotenv/config";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DataSource } from "typeorm";
import { BanList } from "./entity/banlist.entity.js";
import { Player } from "./entity/player.entity.js";
import { PlayerRole } from "./entity/playerRole.entity.js";
import { PlayerRoleEvent } from "./entity/playerRoleEvent.entity.js";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const outputDirectory = dirname(fileURLToPath(import.meta.url));
const databasePath = resolve(packageRoot, process.env.DB_HOST || "haxbotron.sqlite.db");
const migrationsRun = JSON.parse(process.env.DB_MIGRATIONS_RUN || false.toString());

export const appDataSource = new DataSource({
    type: "better-sqlite3",
    database: databasePath,
    entities: [Player, PlayerRole, PlayerRoleEvent, BanList],
    migrations: [join(outputDirectory, "migrations/*.js")],
    migrationsRun,
    logging: true,
    synchronize: false,
});
