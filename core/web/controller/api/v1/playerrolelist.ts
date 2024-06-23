import { Context } from "koa";
import axios from "axios";

interface PlayerRole {
    auth: string;
    name: string;
    role: string;

}

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

const client = axios.create();

axios.defaults.withCredentials = true;

export async function getAllList(ctx: Context) {
    const { searchQuery, start, count } = ctx.request.query;
    let apiPath: string = (start && count)
        ? `${dbConnAddr}player-roles/search?searchQuery=${encodeURIComponent(searchQuery)}&start=${start}&count=${count}`
        : `${dbConnAddr}player-roles/search?searchQuery=${encodeURIComponent(searchQuery)}`;

    try {
        const getRes = await client.get(apiPath)
            .then((response) => {
                return response.data as PlayerRole[];
            })
            .catch((error) => {
                throw(error.response.status || 500);
            });
        ctx.body = getRes;
        ctx.status = 200;
    } catch (error) {
        ctx.status = error;
    }
}

export async function addPlayerRole(ctx: Context) {
    const { auth } = ctx.params;
    const { name, role } = ctx.request.body;

    try {
        await client.post(`${dbConnAddr}player-roles/${auth}`, {name, role})
            .then((response) => {
            })
            .catch((error) => {
                throw(error.response.status || 500);
            });

        ctx.status = 204;
    } catch (error) {
        ctx.status = error;
    }
}

export async function updatePlayerRole(ctx: Context) {
    const { auth } = ctx.params;
    const { name, role } = ctx.request.body;

    try {
        await client.put(`${dbConnAddr}player-roles/${auth}`, {name, role})
            .then((response) => {
            })
            .catch((error) => {
                throw(error.response.status || 500);
            });

        ctx.status = 204;
    } catch (error) {
        ctx.status = error;
    }
}

export async function deletePlayerRole(ctx: Context) {
    const { auth, name, role } = ctx.params;

    try {
        await client.delete(`${dbConnAddr}player-roles/${auth}`)
            .then((response) => {
            })
            .catch((error) => {
                throw(error.response.status || 500);
            });

        ctx.status = 204;
    } catch (error) {
        ctx.status = error;
    }
}