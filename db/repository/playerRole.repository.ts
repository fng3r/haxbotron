import { getRepository, Repository } from 'typeorm';
import { IRepository } from './repository.interface';
import { PlayerRole } from '../entity/playerRole.entity';
import { PlayerRoleModel } from '../model/PlayerRoleModel';

export interface IPlayerRoleRepository {
    get(auth: string) : Promise<PlayerRole>;
    create(auth: string, name: string, role: string) : Promise<void>;
    set(auth: string, name: string, role: string) : Promise<void>;
    delete(auth: string, name: string): Promise<void>;
}

export class PlayerRoleRepository implements IPlayerRoleRepository {
    private get repository() {
        return getRepository(PlayerRole);
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
        await this.repository.delete({auth: auth, name: name});
    }
}