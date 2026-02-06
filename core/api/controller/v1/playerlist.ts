import axios from "axios";
import { Context } from "koa";
import { dbClient } from "../../../lib/DBClient";
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

export async function getAllList(ctx: Context) {
    const { ruid } = ctx.params;
    const { searchQuery, start, count } = ctx.request.query;
    
    try {
        const players = await dbClient.searchPlayers(
            ruid,
            searchQuery as string | undefined,
            start ? parseInt(start as string) : undefined,
            count ? parseInt(count as string) : undefined
        );
        
        const playerList: PlayerStorage[] = players.map((item: PlayerStorageList) => {
            const { uid, ruid, ...rest } = item;
            return rest;
        });
        
        ctx.status = 200;
        ctx.body = playerList;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            if (error.response.status === 404) {
                throw new NotFoundError('Player list', ruid);
            }
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
        const player = await dbClient.getPlayerByAuth(ruid, auth);
        
        const { uid, ruid: _, ...playerInfo } = player;

        ctx.status = 200;
        ctx.body = playerInfo;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            if (error.response.status === 404) {
                throw new NotFoundError('Player', auth);
            }
            throw new ExternalServiceError('Database', error.message, {
                status: error.response.status
            });
        }
        throw error;
    }
}
