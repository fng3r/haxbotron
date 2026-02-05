import axios from "axios";
import { Context } from "koa";
import { getDbConnectionUrl } from "../../../lib/config";
import { ExternalServiceError, NotFoundError } from "../../../lib/errors";

interface PlayerStorageList {
    uid: number;
    ruid: string;
    auth: string;
    conn: string;
    name: string;
    mute: boolean;
    muteExpire: number;
    rejoinCount: number;
    joinDate: number;
    leftDate: number;
    malActCount: number;
}

type PlayerStorage = Omit<PlayerStorageList, "uid"|"ruid">;

const dbConnAddr: string = getDbConnectionUrl();

const client = axios.create();

axios.defaults.withCredentials = true;

export async function getAllList(ctx: Context) {
    const { ruid } = ctx.params;
    const { searchQuery, start, count } = ctx.request.query;
    const apiPath: string = (start && count)
        ? `${dbConnAddr}room/${ruid}/player/search?searchQuery=${encodeURIComponent(searchQuery as string || '')}&start=${start}&count=${count}`
        : `${dbConnAddr}room/${ruid}/player/search?searchQuery=${encodeURIComponent(searchQuery as string || '')}`;
    
    try {
        const response = await client.get(apiPath);
        const getRes = response.data as PlayerStorageList[];
        
        const playerList: PlayerStorage[] = getRes.map((item: PlayerStorageList) => {
            const { uid, ruid, ...rest } = item;
            return rest;
        });
        
        ctx.status = 200;
        ctx.body = playerList;
    } catch (error: any) {
        if (error.response?.status === 404) {
            throw new NotFoundError('Player list', ruid);
        }
        if (error.response) {
            throw new ExternalServiceError('Database', error.message, {
                status: error.response.status
            });
        }
        throw error;
    }
}

export async function getPlayerInfo(ctx: Context) {
    const { ruid, auth } = ctx.params;

    try {
        const response = await client.get(`${dbConnAddr}room/${ruid}/player/${auth}`);
        const getRes = response.data as PlayerStorageList;
        
        const { uid, ruid: _, ...playerInfo } = getRes;

        ctx.status = 200;
        ctx.body = playerInfo;
    } catch (error: any) {
        if (error.response?.status === 404) {
            throw new NotFoundError('Player', auth);
        }
        if (error.response) {
            throw new ExternalServiceError('Database', error.message, {
                status: error.response.status
            });
        }
        throw error;
    }
}
