import axios from "axios";
import { Context } from "koa";
import { getDbConnectionUrl } from "../../../lib/config";
import { ExternalServiceError, NotFoundError, ValidationError } from "../../../lib/errors";

interface BanList {
    uid: number
    ruid: string
    conn: string
    auth: string
    reason: string
    register: number
    expire: number
}

interface BanListItem {
    conn: string;
    auth: string;
    reason: string;
    register: number;
    expire: number;
}

const dbConnAddr: string = getDbConnectionUrl();

const client = axios.create();

axios.defaults.withCredentials = true;

export async function getAllList(ctx: Context) {
    const { ruid } = ctx.params;
    const { start, count } = ctx.request.query;
    const apiPath: string = (start && count) 
        ? `${dbConnAddr}room/${ruid}/banlist?start=${start}&count=${count}` 
        : `${dbConnAddr}room/${ruid}/banlist`;
    
    try {
        const response = await client.get(apiPath);
        const getRes = response.data as BanList[];
        
        const banListItems: BanListItem[] = getRes.map((item: BanList) => ({
            conn: item.conn,
            auth: item.auth,
            reason: item.reason,
            register: item.register,
            expire: item.expire
        }));
        
        ctx.status = 200;
        ctx.body = banListItems;
    } catch (error: any) {
        if (error.response) {
            if (error.response.status === 404) {
                throw new NotFoundError('Banlist', ruid);
            }
            throw new ExternalServiceError('Database', error.message, {
                status: error.response.status,
                data: error.response.data
            });
        }
        throw error;
    }
}

export async function getBanInfo(ctx: Context) {
    const { ruid, conn } = ctx.params;

    try {
        const response = await client.get(`${dbConnAddr}room/${ruid}/banlist/${conn}`);
        const getRes = response.data as BanList;
        
        const banInfo: BanListItem = {
            conn: getRes.conn,
            auth: getRes.auth,
            reason: getRes.reason,
            register: getRes.register,
            expire: getRes.expire
        };
        
        ctx.status = 200;
        ctx.body = banInfo;
    } catch (error: any) {
        if (error.response?.status === 404) {
            throw new NotFoundError('Ban', conn);
        }
        if (error.response) {
            throw new ExternalServiceError('Database', error.message, {
                status: error.response.status
            });
        }
        throw error;
    }
}

export async function banPlayer(ctx: Context) {
    const { ruid } = ctx.params;
    const { conn, auth, reason, seconds } = ctx.request.body;

    if (!conn || !auth || !reason || !seconds) {
        throw new ValidationError('Missing required fields: conn, auth, reason, and seconds are required');
    }

    const nowTimeStamp: number = Math.floor(Date.now());
    const submitItem: BanListItem = {
        conn,
        auth,
        reason,
        register: nowTimeStamp,
        expire: nowTimeStamp + (seconds * 1000)
    };

    try {
        await client.post(`${dbConnAddr}room/${ruid}/banlist`, submitItem);
        ctx.status = 204;
    } catch (error: any) {
        if (error.response) {
            throw new ExternalServiceError('Database', error.message, {
                status: error.response.status,
                data: error.response.data
            });
        }
        throw error;
    }
}

export async function unbanPlayer(ctx: Context) {
    const { ruid, conn } = ctx.params;
    
    try {
        await client.delete(`${dbConnAddr}room/${ruid}/banlist/${conn}`);
        ctx.status = 204;
    } catch (error: any) {
        if (error.response?.status === 404) {
            throw new NotFoundError('Ban', conn);
        }
        if (error.response) {
            throw new ExternalServiceError('Database', error.message, {
                status: error.response.status
            });
        }
        throw error;
    }
}