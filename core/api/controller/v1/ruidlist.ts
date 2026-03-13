import axios from "axios";
import { Context } from "koa";
import { apiDbAdapter as dbClient } from "../../../lib/db/adapters/ApiDbAdapter";
import { ExternalServiceError } from "../../../lib/errors";

export async function getAllList(ctx: Context) {
    try {
        const ruidList = await dbClient.getRuidList();
        
        ctx.status = 200;
        ctx.body = ruidList;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            throw new ExternalServiceError('Database', error.message, {
                status: error.response.status
            });
        }
        throw error;
    }
}
