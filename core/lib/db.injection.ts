import "dotenv/config";
import axios from "axios";
import { PlayerStorage } from "../game/model/GameObject/PlayerObject";
import { PlayerRole } from "../game/model/PlayerRole/PlayerRole";
import { winstonLogger } from "../winstonLoggerSystem";
import { BanList } from "../game/model/PlayerBan/BanList";


// These functions will be injected into bot script on puppeteer

const dbConnAddr: string = (
    'http://'
    + ((process.env.SERVER_CONN_DB_HOST) ? (process.env.SERVER_CONN_DB_HOST) : ('127.0.0.1'))
    + ':'
    + ((process.env.SERVER_CONN_DB_PORT) ? (process.env.SERVER_CONN_DB_PORT) : ('13001'))
    + '/'
    + 'api/'
    + ((process.env.SERVER_CONN_DB_APIVER) ? (process.env.SERVER_CONN_DB_APIVER) : ('v1'))
    + '/'
);

export async function createSuperadminDB(ruid: string, key: string, description: string): Promise<void> {
    try {
        const result = await axios.post(`${dbConnAddr}room/${ruid}/superadmin`, {key: key, description: description});
        if (result.status === 204 && result.data) {
            winstonLogger.info(`${result.status} Succeed on createSuperadminDB: Created. key(${key})`);
        }
    } catch(error) {
        if(error.response && error.response.status === 400) {
            winstonLogger.info(`${error.response.status} Failed on createSuperadminDB: Already exist. key(${key})`);
        } else {
            winstonLogger.error(`Error caught on createSuperadminDB: ${error}`);
        }
    }
}

export async function readSuperadminDB(ruid: string, key: string): Promise<string | undefined> {
    try {
        const result = await axios.get(`${dbConnAddr}room/${ruid}/superadmin/${key}`);
        if (result.status === 200 && result.data) {
            winstonLogger.info(`200 Succeed on readSuperadminDB: Read. key(${key})`);
            return result.data.description;
        }
    } catch (error) {
        if(error.response && error.response.status === 404) {
            winstonLogger.info(`${error.response.status} Failed on readSuperadminDB: No exist. key(${key})`);
        } else {
            winstonLogger.error(`Error caught on readSuperadminDB: ${error}`);
        }
    }
}

//async function updateSuperadminDB is not implemented.

export async function deleteSuperadminDB(ruid: string, key: string): Promise<void> {
    try {
        const result = await axios.delete(`${dbConnAddr}room/${ruid}/superadmin/${key}`);
        if (result.status === 204) {
            winstonLogger.info(`${result.status} Succeed on deleteSuperadminDB: Deleted. key(${key})`);
        }
    } catch (error) {
        if(error.response && error.response.status === 404) {
            winstonLogger.info(`${error.response.status} Failed on deleteSuperadminDB: No exist. key(${key})`);
        } else {
            winstonLogger.error(`Error caught on deleteSuperadminDB: ${error}`);
        }
    }
}

export async function createBanlistDB(ruid: string, banList: BanList): Promise<void> {
    try {
        const result = await axios.post(`${dbConnAddr}room/${ruid}/banlist`, banList);
        if (result.status === 204 && result.data) {
            winstonLogger.info(`${result.status} Succeed on createBanlistDB: Created. conn(${banList.conn})`);
        }
    } catch(error) {
        if(error.response && error.response.status === 400) {
            winstonLogger.info(`${error.response.status} Failed on createBanlistDB: Already exist. conn(${banList.conn})`);
        } else {
            winstonLogger.error(`Error caught on createBanlistDB: ${error}`);
        }
    }
}

export async function readBanlistDB(ruid: string, playerConn: string): Promise<BanList | undefined> {
    try {
        const result = await axios.get(`${dbConnAddr}room/${ruid}/banlist/${playerConn}`);
        if (result.status === 200 && result.data) {
            const banlist: BanList = {
                conn: result.data.conn,
                reason: result.data.reason,
                register: result.data.register,
                expire: result.data.expire
            }
            winstonLogger.info(`200 Succeed on readBanlistDB: Read. onn(${playerConn})`);
            return banlist;
        }
    } catch (error) {
        if(error.response && error.response.status === 404) {
            winstonLogger.info(`${error.response.status} Failed on readBanlistDB: No exist. conn(${playerConn})`);
        } else {
            winstonLogger.error(`Error caught on readBanlistDB: ${error}`);
        }
    }
}

export async function updateBanlistDB(ruid: string, banList: BanList):Promise<void> {
    try {
        const result = await axios.put(`${dbConnAddr}room/${ruid}/banlist/${banList.conn}`, banList);
        if (result.status === 204 && result.data) {
            winstonLogger.info(`${result.status} Succeed on updateBanlistDB: Updated. conn(${banList.conn})`);
        }
    } catch(error) {
        if(error.response && error.response.status === 404) {
            winstonLogger.info(`${error.response.status} Failed on updateBanlistDB: No Exist. conn(${banList.conn})`);
        } else {
            winstonLogger.error(`Error caught on updateBanlistDB: ${error}`);
        }
    }
}

export async function deleteBanlistDB(ruid: string, playerConn: string): Promise<void> {
    try {
        const result = await axios.delete(`${dbConnAddr}room/${ruid}/banlist/${playerConn}`);
        if (result.status === 204) {
            winstonLogger.info(`${result.status} Succeed on deleteBanlistDB: Deleted. conn(${playerConn})`);
        }
    } catch (error) {
        if(error.response && error.response.status === 404) {
            winstonLogger.info(`${error.response.status} Failed on deleteBanlistDB: No exist. conn(${playerConn})`);
        } else {
            winstonLogger.error(`Error caught on deleteBanlistDB: ${error}`);
        }
    }
}

export async function createPlayerDB(ruid: string, player: PlayerStorage): Promise<void> {
    try {
        const result = await axios.post(`${dbConnAddr}room/${ruid}/player`, player);
        if (result.status === 204 && result.data) {
            winstonLogger.info(`${result.status} Succeed on createPlayerDB: Created. auth(${player.auth})`);
        }
    } catch(error) {
        if(error.response && error.response.status === 400) {
            winstonLogger.info(`${error.response.status} Failed on createPlayerDB: Already exist. auth(${player.auth})`);
        } else {
            winstonLogger.error(`Error caught on createPlayerDB: ${error}`);
        }
    }
}

export async function readPlayerDB(ruid: string, playerAuth: string): Promise<PlayerStorage | undefined> {
    try {
        const result = await axios.get(`${dbConnAddr}room/${ruid}/player/${playerAuth}`);
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
                malActCount: result.data.malActCount
            }
            winstonLogger.info(`${result.status} Succeed on readPlayerDB: Read. auth(${playerAuth})`);
            return player;
        }
    } catch (error) {
        if(error.response && error.response.status === 404) {
            winstonLogger.info(`${error.response.status} Failed on readPlayerDB: No exist. auth(${playerAuth})`);
        } else {
            winstonLogger.error(`Error caught on readPlayerDB: ${error}`);
        }
    }
}

export async function updatePlayerDB(ruid: string, player: PlayerStorage): Promise<void> {
    try {
        const result = await axios.put(`${dbConnAddr}room/${ruid}/player/${player.auth}`, player);
        if (result.status === 204 && result.data) {
            winstonLogger.info(`${result.status} Succeed on updatePlayerDB: Updated. auth(${player.auth})`);
        }
    } catch(error) {
        if(error.response && error.response.status === 404) {
            winstonLogger.info(`${error.response.status} Failed on updatePlayerDB: No exist. auth(${player.auth})`);
        } else {
            winstonLogger.error(`Error caught on updatePlayerDB: ${error}`);
        }
    }
}

export async function deletePlayerDB(ruid: string, playerAuth: string): Promise<void> {
    try {
        const result = await axios.delete(`${dbConnAddr}room/${ruid}/player/${playerAuth}`);
        if (result.status === 204) {
            winstonLogger.info(`${result.status} Succeed on deletePlayerDB: Deleted. auth(${playerAuth})`);
        }
    } catch (error) {
        if(error.response && error.response.status === 404) {
            winstonLogger.info(`${error.response.status} Failed on deletePlayerDB: No exist. auth(${playerAuth})`);
        } else {
            winstonLogger.error(`Error caught on deletePlayerDB: ${error}`);
        }
    }
}

export async function getPlayerRoleDB(playerAuth: string): Promise<PlayerRole | undefined> {
    try {
        const result = await axios.get(`${dbConnAddr}player-roles/${playerAuth}`);
        if (result.status === 200 && result.data) {
            winstonLogger.info(`${result.status} Succeed on getPlayerRoleDB: Updated. auth(${playerAuth})`);
            const playerRole: PlayerRole = {
                auth: result.data.auth,
                name: result.data.name,
                role: result.data.role
            }
            return playerRole;
        }
    } catch(error) {
        if(error.response && error.response.status === 404) {
            winstonLogger.info(`${error.response.status} Failed on getPlayerRoleDB: No exist. auth(${playerAuth})`);
        } else {
            winstonLogger.error(`Error caught on getPlayerRoleDB: ${error}`);
        }
    }
}

export async function createPlayerRoleDB(playerRole: PlayerRole): Promise<void> {
    try {
        const result = await axios.post(`${dbConnAddr}player-roles/${playerRole.auth}?name=${playerRole.name}&role=${playerRole.role}`);
        if (result.status === 204) {
            winstonLogger.info(`${result.status} Succeed on setPlayerRoleDB: Updated. auth(${playerRole.auth})`);
        }
    } catch(error) {
        if(error.response && error.response.status === 409) {
            winstonLogger.info(`${error.response.status} Failed on createPlayerRoleDB: Already exist. auth(${playerRole.auth})`);
        } else {
            winstonLogger.error(`Error caught on createPlayerRoleDB: ${error}`);
        }
    }
}

export async function setPlayerRoleDB(playerRole: PlayerRole): Promise<void> {
    try {
        const result = await axios.put(`${dbConnAddr}player-roles/${playerRole.auth}?name=${playerRole.name}&role=${playerRole.role}`);
        if (result.status === 204) {
            winstonLogger.info(`${result.status} Succeed on setPlayerRoleDB: Updated. auth(${playerRole.auth})`);
        }
    } catch(error) {
        if(error.response && error.response.status === 404) {
            winstonLogger.info(`${error.response.status} Failed on setPlayerRoleDB: No exist. auth(${playerRole.auth})`);
        } else {
            winstonLogger.error(`Error caught on setPlayerRoleDB: ${error}`);
        }
    }
}

export async function deletePlayerRoleDB(playerRole: PlayerRole): Promise<void> {
    try {
        const result = await axios.delete(`${dbConnAddr}player-roles/${playerRole.auth}?name=${playerRole.name}`);
        if (result.status === 204) {
            winstonLogger.info(`${result.status} Succeed on deletePlayerRoleDB: Deleted. auth(${playerRole.auth})`);
        }
    } catch (error) {
        if(error.response && error.response.status === 404) {
            winstonLogger.info(`${error.response.status} Failed on deletePlayerRoleDB: No exist. auth(${playerRole.auth})`);
        } else {
            winstonLogger.error(`Error caught on deletePlayerRoleDB: ${error}`);
        }
    }
}
