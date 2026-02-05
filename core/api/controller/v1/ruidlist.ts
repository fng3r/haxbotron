import axios from "axios";
import { Context } from "koa";
import { getDbConnectionUrl } from "../../../lib/config";
import { ExternalServiceError } from "../../../lib/errors";

interface ruidListItem {
    ruid: string
}

const dbConnAddr: string = getDbConnectionUrl();

const client = axios.create();

axios.defaults.withCredentials = true;

export async function getAllList(ctx: Context) {
    try {
        const response = await client.get(`${dbConnAddr}ruidlist`);
        const getRes = response.data as ruidListItem[];
        
        ctx.status = 200;
        ctx.body = getRes;
    } catch (error: any) {
        if (error.response) {
            throw new ExternalServiceError('Database', error.message, {
                status: error.response.status
            });
        }
        throw error;
    }
}
