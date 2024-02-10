import { Player } from "../model/GameObject/Player";
import { PlayerStorage } from "../model/GameObject/PlayerObject";
import { PlayerRole } from "../model/PlayerRole/PlayerRole";
import { BanList } from "../model/PlayerBan/BanList";

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
        malActCount: player.permissions.malActCount // count for malicious behaviour like Brute force attack
    }
}

// CRUDs with DB Server by injected functions from Node Main Application
// register new player or update it
export async function setPlayerDataToDB(playerStorage: PlayerStorage): Promise<void> {
    const player: PlayerStorage | undefined = await window._readPlayerDB(window.gameRoom.config._RUID, playerStorage.auth);
    if(player !== undefined) {
        //if already exist then update it
        await window._updatePlayerDB(window.gameRoom.config._RUID, playerStorage);
    } else {
        // or create new one
        await window._createPlayerDB(window.gameRoom.config._RUID, playerStorage);
    }
}

// get player data
export async function getPlayerDataFromDB(playerAuth: string): Promise<PlayerStorage | undefined> {
    const player: PlayerStorage | undefined = await window._readPlayerDB(window.gameRoom.config._RUID, playerAuth);
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
    const banplayer: BanList | undefined = await window._readBanlistDB(window.gameRoom.config._RUID, banList.conn);
    if(banplayer !== undefined) {
        //if already exist then update it
        await window._updateBanlistDB(window.gameRoom.config._RUID, banList);
    } else {
        // or create new one
        await window._createBanlistDB(window.gameRoom.config._RUID, banList);
    }
}

// get exist ban
export async function getBanlistDataFromDB(playerConn: string): Promise<BanList | undefined> {
    const banplayer: BanList | undefined = await window._readBanlistDB(window.gameRoom.config._RUID, playerConn);
    return banplayer;
}

// remove exist ban
export async function removeBanlistDataFromDB(playerConn: string): Promise<void> {
    await window._deleteBanlistDB(window.gameRoom.config._RUID, playerConn);
}
