import axios from "axios";
import { Context } from "koa";
import { getDbConnectionUrl } from "../../../lib/config";
import { ConflictError, ExternalServiceError, NotFoundError, ValidationError } from "../../../lib/errors";

interface PlayerRole {
    auth: string;
    name: string;
    role: string;
}

enum PlayerRoleEventType {
    addRole = 'addrole',
    removeRole = 'rmrole',
    updateRole = 'updaterole'
}

interface PlayerRoleEvent {
    type: PlayerRoleEventType;
    auth: string;
    name: string;
    role: string;
    timestamp: number;
}

const dbConnAddr: string = getDbConnectionUrl();

const client = axios.create();

axios.defaults.withCredentials = true;

export async function getAllList(ctx: Context) {
    const { searchQuery, start, count } = ctx.request.query;
    const apiPath: string = (start && count)
        ? `${dbConnAddr}player-roles/search?searchQuery=${encodeURIComponent(searchQuery as string || '')}&start=${start}&count=${count}`
        : `${dbConnAddr}player-roles/search?searchQuery=${encodeURIComponent(searchQuery as string || '')}`;

    try {
        const response = await client.get(apiPath);
        const getRes = response.data as PlayerRole[];
        
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

export async function addPlayerRole(ctx: Context) {
    const { auth } = ctx.params;
    const { name, role } = ctx.request.body;

    if (!name || !role) {
        throw new ValidationError('Missing required fields: name and role are required');
    }

    try {
        await client.post(`${dbConnAddr}player-roles/${auth}`, { name, role });
        ctx.status = 204;
    } catch (error: any) {
        if (error.response?.status === 409) {
            throw new ConflictError(`Player with auth '${auth}' is already added`);
        }
        if (error.response) {
            throw new ExternalServiceError('Database', error.message, {
                status: error.response.status
            });
        }
        throw error;
    }
}

export async function updatePlayerRole(ctx: Context) {
    const { auth } = ctx.params;
    const { name, role } = ctx.request.body;

    if (!name || !role) {
        throw new ValidationError('Missing required fields: name and role are required');
    }

    try {
        await client.put(`${dbConnAddr}player-roles/${auth}`, { name, role });
        ctx.status = 204;
    } catch (error: any) {
        if (error.response?.status === 404) {
            throw new NotFoundError('Player role', auth);
        }
        if (error.response) {
            throw new ExternalServiceError('Database', error.message, {
                status: error.response.status
            });
        }
        throw error;
    }
}

export async function deletePlayerRole(ctx: Context) {
    const { auth } = ctx.params;
    const { name } = ctx.request.query;

    if (!name) {
        throw new ValidationError('Missing required parameter: name');
    }

    try {
        await client.delete(`${dbConnAddr}player-roles/${auth}?name=${encodeURIComponent(name as string)}`);
        ctx.status = 204;
    } catch (error: any) {
        if (error.response?.status === 404) {
            throw new NotFoundError('Player role', auth);
        }
        if (error.response) {
            throw new ExternalServiceError('Database', error.message, {
                status: error.response.status
            });
        }
        throw error;
    }
}

export async function getEventsList(ctx: Context) {
    const { searchQuery, start, count } = ctx.request.query;
    const apiPath: string = (start && count)
        ? `${dbConnAddr}player-roles/events?searchQuery=${encodeURIComponent(searchQuery as string || '')}&start=${start}&count=${count}`
        : `${dbConnAddr}player-roles/events?searchQuery=${encodeURIComponent(searchQuery as string || '')}`;

    try {
        const response = await client.get(apiPath);
        const getRes = response.data as PlayerRoleEvent[];
        
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
