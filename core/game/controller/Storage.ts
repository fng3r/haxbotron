import { Player } from "../model/GameObject/Player";
import { PlayerStorage } from "../model/GameObject/PlayerObject";
import { BanList } from "../model/PlayerBan/BanList";
import { PlayerRole } from "../model/PlayerRole/PlayerRole";
import { ServiceContainer } from "../services/ServiceContainer";

// Utilities
export function convertToPlayerStorage(player: Player): PlayerStorage {
    return {
        auth: player.auth, // same meaning as in PlayerObject. It can used for identify each of players.
        conn: player.conn, // same meaning as in PlayerObject.
        name: player.name, // save for compare player's current name and previous name.
        mute: player.permissions.mute, // is this player muted? 
        muteExpire: player.permissions.muteExpire, // expiration date of mute. -1 means Permanent mute.. (unix timestamp)
        rejoinCount: player.entrytime.rejoinCount, // How many rejoins this player has made.
        joinDate: player.entrytime.joinDate, // player join time
        leftDate: player.entrytime.leftDate, // player left time
        nicknames: Array.from(player.nicknames.values()),
        malActCount: player.permissions.malActCount // count for malicious behaviour like Brute force attack
    }
}

// CRUDs with DB Server by injected functions from Node Main Application
// register new player or update it
export async function setPlayerDataToDB(playerStorage: PlayerStorage): Promise<void> {
    const ruid = ServiceContainer.getInstance().config.getRUID();
    const player: PlayerStorage | undefined = await window._readPlayerDB(ruid, playerStorage.auth);
    if(player !== undefined) {
        //if already exist then update it
        await window._updatePlayerDB(ruid, playerStorage);
    } else {
        // or create new one
        await window._createPlayerDB(ruid, playerStorage);
    }
}

// get player data
export async function getPlayerDataFromDB(playerAuth: string): Promise<PlayerStorage | undefined> {
    const ruid = ServiceContainer.getInstance().config.getRUID();
    const player: PlayerStorage | undefined = await window._readPlayerDB(ruid, playerAuth);
    return player;
}

// get player data
export async function getPlayerRoleFromDB(playerAuth: string): Promise<PlayerRole | undefined> {
    const playerRole: PlayerRole | undefined = await window._getPlayerRoleDB(playerAuth);
    return playerRole;
}

export async function createPlayerRoleToDB(playerRole: PlayerRole): Promise<void> {
    await window._createPlayerRoleDB(playerRole);
}

export async function setPlayerRoleToDB(playerRole: PlayerRole): Promise<void> {
    await window._setPlayerRoleDB(playerRole);
}

export async function deletePlayerRoleFromDB(playerRole: PlayerRole): Promise<void> {
    await window._deletePlayerRoleDB(playerRole);
}

// register new ban or update it
export async function setBanlistDataToDB(banList: BanList): Promise<void> {
    const ruid = ServiceContainer.getInstance().config.getRUID();
    const banplayer: BanList | undefined = await window._readBanlistDB(ruid, banList.conn);
    if(banplayer !== undefined) {
        //if already exist then update it
        await window._updateBanlistDB(ruid, banList);
    } else {
        // or create new one
        await window._createBanlistDB(ruid, banList);
    }
}

// get exist ban
export async function getBanlistDataFromDB(playerConn: string): Promise<BanList | undefined> {
    const ruid = ServiceContainer.getInstance().config.getRUID();
    const banplayer: BanList | undefined = await window._readBanlistDB(ruid, playerConn);
    return banplayer;
}

// get exist ban
export async function getAllBansFromDB(playerConn: string): Promise<BanList[] | undefined> {
    const ruid = ServiceContainer.getInstance().config.getRUID();
    const bannedPlayers: BanList[] | undefined = await window._getAllBansDB(ruid);
    return bannedPlayers;
}

// remove exist ban
export async function removeBanlistDataFromDB(playerConn: string): Promise<void> {
    const ruid = ServiceContainer.getInstance().config.getRUID();
    await window._deleteBanlistDB(ruid, playerConn);
}
