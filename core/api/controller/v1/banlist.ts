import axios from "axios";
import { Context } from "koa";
import { dbClient } from "../../../lib/DBClient";
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

export async function getAllList(ctx: Context) {
    const { ruid } = ctx.params;
    const { start, count } = ctx.request.query;
    
    try {
        const banList = await dbClient.getBanList(
            ruid,
            start ? parseInt(start as string) : undefined,
            count ? parseInt(count as string) : undefined
        );
        
        const banListItems: BanListItem[] = banList.map((item: BanList) => ({
            conn: item.conn,
            auth: item.auth,
            reason: item.reason,
            register: item.register,
            expire: item.expire
        }));
        
        ctx.status = 200;
        ctx.body = banListItems;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
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
        const ban = await dbClient.getBanByConn(ruid, conn);
        
        const banInfo: BanListItem = {
            conn: ban.conn,
            auth: ban.auth,
            reason: ban.reason,
            register: ban.register,
            expire: ban.expire
        };
        
        ctx.status = 200;
        ctx.body = banInfo;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            if (error.response.status === 404) {
                throw new NotFoundError('Ban', conn);
            }
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
    const banData = {
        conn,
        auth,
        reason,
        register: nowTimeStamp,
        expire: nowTimeStamp + (seconds * 1000)
    };

    try {
        await dbClient.createBan(ruid, banData);
        ctx.status = 204;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
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
        await dbClient.deleteBan(ruid, conn);
        ctx.status = 204;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            if (error.response.status === 404) {
                throw new NotFoundError('Ban', conn);
            }
            throw new ExternalServiceError('Database', error.message, {
                status: error.response.status
            });
        }
        throw error;
    }
}