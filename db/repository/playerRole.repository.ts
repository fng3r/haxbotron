import { getRepository, Like } from 'typeorm';
import { PlayerRole } from '../entity/playerRole.entity';
import {Player} from "../entity/player.entity";
import { PlayerRoleEvent, PlayerRoleEventType } from '../entity/playerRoleEvent.entity';

export interface IPlayerRoleRepository {
    get(auth: string) : Promise<PlayerRole>;
    create(auth: string, name: string, role: string) : Promise<void>;
    set(auth: string, name: string, role: string) : Promise<void>;
    delete(auth: string, name: string): Promise<void>;

    findAll(pagination?: {start: number; count: number}): Promise<PlayerRole[]>;
    search(searchQuery: string, pagination: { start: number; count: number; }): Promise<PlayerRole[]>
    searchEvents(searchQuery: string, pagination: { start: number; count: number; }): Promise<PlayerRoleEvent[]>
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

        const timestamp = this.getUnixTimestamp();
        await this.addEvent(PlayerRoleEventType.addRole, auth, name, role, timestamp);
    }

    public async set(auth: string, name: string, role: string): Promise<void> {
        await this.repository.update({auth: auth, name: name}, {role: role});

        const timestamp = this.getUnixTimestamp();
        await this.addEvent(PlayerRoleEventType.updateRole, auth, name, role, timestamp);
    }

    public async delete(auth: string, name: string): Promise<void> {
        await this.repository.delete({auth: auth, name: name});

        const timestamp = this.getUnixTimestamp();
        await this.addEvent(PlayerRoleEventType.removeRole, auth, name, '', timestamp);
    }

    public async addEvent(type: string, auth: string, name: string, role: string, timestamp: number): Promise<void> {
        const repository = getRepository(PlayerRoleEvent);
        
        await repository.save({type: type, auth: auth, name: name, role: role, timestamp: timestamp});
    }

    public async searchEvents(searchQuery: string, pagination: { start: number; count: number; }): Promise<PlayerRoleEvent[]> {
        const repository = getRepository(PlayerRoleEvent);
        const events = await repository.find({
            where: [
                { auth: Like(`%${searchQuery}%`)},
                { name: Like(`%${searchQuery}%`)},
            ],
            skip: pagination.start,
            take: pagination.count,
            order: {timestamp: 'DESC'}
        });

        return events;
    }

    private getUnixTimestamp(): number {
        return Math.floor(Date.now());
    }
}