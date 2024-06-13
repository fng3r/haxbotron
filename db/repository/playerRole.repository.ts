import { getRepository, Repository, Like } from 'typeorm';
import { IRepository } from './repository.interface';
import { PlayerRole } from '../entity/playerRole.entity';
import { PlayerRoleModel } from '../model/PlayerRoleModel';
import {Player} from "../entity/player.entity";

export interface IPlayerRoleRepository {
    get(auth: string) : Promise<PlayerRole>;
    create(auth: string, name: string, role: string) : Promise<void>;
    set(auth: string, name: string, role: string) : Promise<void>;
    delete(auth: string, name: string): Promise<void>;

    findAll(pagination?: {start: number; count: number}): Promise<PlayerRole[]>;
    search(searchQuery: string, pagination: { start: number; count: number; }): Promise<PlayerRole[]>
}

export class PlayerRoleRepository implements IPlayerRoleRepository {
    private get repository() {
        return getRepository(PlayerRole);
    }

    public async search(searchQuery: string, pagination: { start: number; count: number; }): Promise<PlayerRole[]> {
        const players = await this.repository.find({
            where: [
                { auth: Like(`%${searchQuery}%`)},
                { name: Like(`%${searchQuery}%`)},
            ],
            skip: pagination.start,
            take: pagination.count
        });

        return players;
    }

    public async findAll(pagination?: { start: number; count: number; }): Promise<PlayerRole[]> {
        let players: PlayerRole[] = [];
        if(pagination) {
            players = await this.repository.find({skip: pagination.start, take: pagination.count});
        } else {
            players = await this.repository.find({});
        }
        if (players.length === 0) throw new Error('There are no players.');
        return players;
    }

    public async get(auth: string): Promise<PlayerRole> {
        const playerRole = await this.repository.findOne({auth: auth});
        if (playerRole === undefined) throw new Error(`Player ${auth} not found`);

        return playerRole;
    }

    public async create(auth: string, name: string, role: string): Promise<void> {
        const playerRole = await this.repository.findOne({auth: auth});
        if (playerRole) throw new Error(`Player ${auth} already has a role ${playerRole.role}`);
        await this.repository.save({auth: auth, name: name, role: role});
    }

    public async set(auth: string, name: string, role: string): Promise<void> {
        await this.repository.update({auth: auth, name: name}, {role: role});
    }

    public async delete(auth: string, name: string): Promise<void> {
        await this.repository.delete({auth: auth});
    }
}