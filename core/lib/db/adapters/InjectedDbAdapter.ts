import { BanList } from "../../../game/model/PlayerBan/BanList";
import { PlayerStorage } from "../../../game/model/GameObject/PlayerObject";
import { PlayerRole } from "../../../game/model/PlayerRole/PlayerRole";
import { winstonLogger } from "../../../winstonLoggerSystem";
import { DbApiGateway } from "../DbApiGateway";

type LoggerLike = {
    info: (message: string) => void;
    error: (message: string) => void;
};

/**
 * Runtime-injected adapter used by browser-exposed DB functions.
 * Preserves legacy behavior: logs and swallows known errors by returning undefined/void.
 */
export class InjectedDbAdapter {
    constructor(
        private readonly gateway: DbApiGateway = new DbApiGateway(),
        private readonly logger: LoggerLike = winstonLogger
    ) {}

    public async createSuperadmin(ruid: string, key: string, description: string): Promise<void> {
        try {
            const result = await this.gateway.createSuperadmin(ruid, key, description);
            if (result.status === 204 && result.data) {
                this.logger.info(`${result.status} Succeed on createSuperadminDB: Created. key(${key})`);
            }
        } catch (error: any) {
            if (error.response && error.response.status === 400) {
                this.logger.info(`${error.response.status} Failed on createSuperadminDB: Already exist. key(${key})`);
            } else {
                this.logger.error(`Error caught on createSuperadminDB: ${error}`);
            }
        }
    }

    public async readSuperadmin(ruid: string, key: string): Promise<string | undefined> {
        try {
            const result = await this.gateway.readSuperadmin(ruid, key);
            if (result.status === 200 && result.data) {
                this.logger.info(`200 Succeed on readSuperadminDB: Read. key(${key})`);
                return result.data.description;
            }
        } catch (error: any) {
            if (error.response && error.response.status === 404) {
                this.logger.info(`${error.response.status} Failed on readSuperadminDB: No exist. key(${key})`);
            } else {
                this.logger.error(`Error caught on readSuperadminDB: ${error}`);
            }
        }
    }

    public async deleteSuperadmin(ruid: string, key: string): Promise<void> {
        try {
            const result = await this.gateway.deleteSuperadmin(ruid, key);
            if (result.status === 204) {
                this.logger.info(`${result.status} Succeed on deleteSuperadminDB: Deleted. key(${key})`);
            }
        } catch (error: any) {
            if (error.response && error.response.status === 404) {
                this.logger.info(`${error.response.status} Failed on deleteSuperadminDB: No exist. key(${key})`);
            } else {
                this.logger.error(`Error caught on deleteSuperadminDB: ${error}`);
            }
        }
    }

    public async createBan(ruid: string, banList: BanList): Promise<void> {
        try {
            const result = await this.gateway.createBan(ruid, banList);
            if (result.status === 204 && result.data) {
                this.logger.info(`${result.status} Succeed on createBanlistDB: Created. conn(${banList.conn})`);
            }
        } catch (error: any) {
            if (error.response && error.response.status === 400) {
                this.logger.info(`${error.response.status} Failed on createBanlistDB: Already exist. conn(${banList.conn})`);
            } else {
                this.logger.error(`Error caught on createBanlistDB: ${error}`);
            }
        }
    }

    public async getAllBans(ruid: string): Promise<BanList[] | undefined> {
        try {
            const result = await this.gateway.getBanList(ruid);
            if (result.status === 200 && result.data) {
                this.logger.info(`200 Succeed on getAllBansDB: Read.`);
                return result.data;
            }
        } catch (error: any) {
            this.logger.error(`Error caught on getAllBansDB: ${error}`);
        }
    }

    public async readBan(ruid: string, playerConn: string): Promise<BanList | undefined> {
        try {
            const result = await this.gateway.readBan(ruid, playerConn);
            if (result.status === 200 && result.data) {
                const banlist: BanList = {
                    conn: result.data.conn,
                    auth: result.data.auth,
                    reason: result.data.reason,
                    register: result.data.register,
                    expire: result.data.expire
                };
                this.logger.info(`200 Succeed on readBanlistDB: Read. onn(${playerConn})`);
                return banlist;
            }
        } catch (error: any) {
            if (error.response && error.response.status === 404) {
                this.logger.info(`${error.response.status} Failed on readBanlistDB: No exist. conn(${playerConn})`);
            } else {
                this.logger.error(`Error caught on readBanlistDB: ${error}`);
            }
        }
    }

    public async updateBan(ruid: string, banList: BanList): Promise<void> {
        try {
            const result = await this.gateway.updateBan(ruid, banList);
            if (result.status === 204 && result.data) {
                this.logger.info(`${result.status} Succeed on updateBanlistDB: Updated. conn(${banList.conn})`);
            }
        } catch (error: any) {
            if (error.response && error.response.status === 404) {
                this.logger.info(`${error.response.status} Failed on updateBanlistDB: No Exist. conn(${banList.conn})`);
            } else {
                this.logger.error(`Error caught on updateBanlistDB: ${error}`);
            }
        }
    }

    public async deleteBan(ruid: string, playerConn: string): Promise<void> {
        try {
            const result = await this.gateway.deleteBan(ruid, playerConn);
            if (result.status === 204) {
                this.logger.info(`${result.status} Succeed on deleteBanlistDB: Deleted. conn(${playerConn})`);
            }
        } catch (error: any) {
            if (error.response && error.response.status === 404) {
                this.logger.info(`${error.response.status} Failed on deleteBanlistDB: No exist. conn(${playerConn})`);
            } else {
                this.logger.error(`Error caught on deleteBanlistDB: ${error}`);
            }
        }
    }

    public async createPlayer(ruid: string, player: PlayerStorage): Promise<void> {
        try {
            const result = await this.gateway.createPlayer(ruid, player);
            if (result.status === 204 && result.data) {
                this.logger.info(`${result.status} Succeed on createPlayerDB: Created. auth(${player.auth})`);
            }
        } catch (error: any) {
            if (error.response && error.response.status === 400) {
                this.logger.info(`${error.response.status} Failed on createPlayerDB: Already exist. auth(${player.auth})`);
            } else {
                this.logger.error(`Error caught on createPlayerDB: ${error}`);
            }
        }
    }

    public async readPlayer(ruid: string, playerAuth: string): Promise<PlayerStorage | undefined> {
        try {
            const result = await this.gateway.readPlayer(ruid, playerAuth);
            if (result.status === 200 && result.data) {
                const player: PlayerStorage = {
                    auth: result.data.auth,
                    conn: result.data.conn,
                    name: result.data.name,
                    mute: result.data.mute,
                    muteExpire: result.data.muteExpire,
                    rejoinCount: result.data.rejoinCount,
                    joinDate: result.data.joinDate,
                    leftDate: result.data.leftDate,
                    nicknames: result.data.nicknames,
                    malActCount: result.data.malActCount
                };
                this.logger.info(`${result.status} Succeed on readPlayerDB: Read. auth(${playerAuth})`);
                return player;
            }
        } catch (error: any) {
            if (error.response && error.response.status === 404) {
                this.logger.info(`${error.response.status} Failed on readPlayerDB: No exist. auth(${playerAuth})`);
            } else {
                this.logger.error(`Error caught on readPlayerDB: ${error}`);
            }
        }
    }

    public async updatePlayer(ruid: string, player: PlayerStorage): Promise<void> {
        try {
            const result = await this.gateway.updatePlayer(ruid, player);
            if (result.status === 204 && result.data) {
                this.logger.info(`${result.status} Succeed on updatePlayerDB: Updated. auth(${player.auth})`);
            }
        } catch (error: any) {
            if (error.response && error.response.status === 404) {
                this.logger.info(`${error.response.status} Failed on updatePlayerDB: No exist. auth(${player.auth})`);
            } else {
                this.logger.error(`Error caught on updatePlayerDB: ${error}`);
            }
        }
    }

    public async deletePlayer(ruid: string, playerAuth: string): Promise<void> {
        try {
            const result = await this.gateway.deletePlayer(ruid, playerAuth);
            if (result.status === 204) {
                this.logger.info(`${result.status} Succeed on deletePlayerDB: Deleted. auth(${playerAuth})`);
            }
        } catch (error: any) {
            if (error.response && error.response.status === 404) {
                this.logger.info(`${error.response.status} Failed on deletePlayerDB: No exist. auth(${playerAuth})`);
            } else {
                this.logger.error(`Error caught on deletePlayerDB: ${error}`);
            }
        }
    }

    public async getPlayerRole(playerAuth: string): Promise<PlayerRole | undefined> {
        try {
            const result = await this.gateway.readPlayerRole(playerAuth);
            if (result.status === 200 && result.data) {
                this.logger.info(`${result.status} Succeed on getPlayerRoleDB: Updated. auth(${playerAuth})`);
                return {
                    auth: result.data.auth,
                    name: result.data.name,
                    role: result.data.role
                };
            }
        } catch (error: any) {
            if (error.response && error.response.status === 404) {
                this.logger.info(`${error.response.status} Failed on getPlayerRoleDB: No exist. auth(${playerAuth})`);
            } else {
                this.logger.error(`Error caught on getPlayerRoleDB: ${error}`);
            }
        }
    }

    public async createPlayerRole(playerRole: PlayerRole): Promise<void> {
        try {
            const result = await this.gateway.createPlayerRoleLegacy(playerRole);
            if (result.status === 204) {
                this.logger.info(`${result.status} Succeed on setPlayerRoleDB: Updated. auth(${playerRole.auth})`);
            }
        } catch (error: any) {
            if (error.response && error.response.status === 409) {
                this.logger.info(`${error.response.status} Failed on createPlayerRoleDB: Already exist. auth(${playerRole.auth})`);
            } else {
                this.logger.error(`Error caught on createPlayerRoleDB: ${error}`);
            }
        }
    }

    public async setPlayerRole(playerRole: PlayerRole): Promise<void> {
        try {
            const result = await this.gateway.updatePlayerRoleLegacy(playerRole);
            if (result.status === 204) {
                this.logger.info(`${result.status} Succeed on setPlayerRoleDB: Updated. auth(${playerRole.auth})`);
            }
        } catch (error: any) {
            if (error.response && error.response.status === 404) {
                this.logger.info(`${error.response.status} Failed on setPlayerRoleDB: No exist. auth(${playerRole.auth})`);
            } else {
                this.logger.error(`Error caught on setPlayerRoleDB: ${error}`);
            }
        }
    }

    public async deletePlayerRole(playerRole: PlayerRole): Promise<void> {
        try {
            const result = await this.gateway.deletePlayerRoleLegacy(playerRole);
            if (result.status === 204) {
                this.logger.info(`${result.status} Succeed on deletePlayerRoleDB: Deleted. auth(${playerRole.auth})`);
            }
        } catch (error: any) {
            if (error.response && error.response.status === 404) {
                this.logger.info(`${error.response.status} Failed on deletePlayerRoleDB: No exist. auth(${playerRole.auth})`);
            } else {
                this.logger.error(`Error caught on deletePlayerRoleDB: ${error}`);
            }
        }
    }
}

export const injectedDbAdapter = new InjectedDbAdapter();
