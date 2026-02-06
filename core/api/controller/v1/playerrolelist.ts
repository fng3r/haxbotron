import axios from "axios";
import { Context } from "koa";
import { dbClient } from "../../../lib/DBClient";
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

export async function getAllList(ctx: Context) {
    const { searchQuery, start, count } = ctx.request.query;
    
    try {
        const roles = await dbClient.searchPlayerRoles(
            searchQuery as string | undefined,
            start ? parseInt(start as string) : undefined,
            count ? parseInt(count as string) : undefined
        );
        
        ctx.status = 200;
        ctx.body = roles;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
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
        await dbClient.createPlayerRole(auth, name, role);
        ctx.status = 204;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            if (error.response.status === 409) {
                throw new ConflictError(`Player with auth '${auth}' is already added`);
            }
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
        await dbClient.updatePlayerRole(auth, name, role);
        ctx.status = 204;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            if (error.response.status === 404) {
                throw new NotFoundError('Player role', auth);
            }
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
        await dbClient.deletePlayerRole(auth, name as string);
        ctx.status = 204;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            if (error.response.status === 404) {
                throw new NotFoundError('Player role', auth);
            }
            throw new ExternalServiceError('Database', error.message, {
                status: error.response.status
            });
        }
        throw error;
    }
}

export async function getEventsList(ctx: Context) {
    const { searchQuery, start, count } = ctx.request.query;
    
    try {
        const events = await dbClient.searchPlayerRoleEvents(
            searchQuery as string | undefined,
            start ? parseInt(start as string) : undefined,
            count ? parseInt(count as string) : undefined
        );
        
        ctx.status = 200;
        ctx.body = events;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            throw new ExternalServiceError('Database', error.message, {
                status: error.response.status
            });
        }
        throw error;
    }
}
