import { Like, type Repository } from "typeorm";
import { appDataSource } from "../dataSource.js";
import { Player } from "../entity/player.entity.js";
import type { PlayerModel } from "../model/PlayerModel.js";
import type { IRepository } from "./repository.interface.js";

export interface IPlayerRepository extends IRepository<Player> {
    search(ruid: string, searchQuery: string, pagination: { start: number; count: number; }): Promise<Player[]>
}

export class PlayerRepository implements IPlayerRepository {
    public constructor(private readonly dataSource = appDataSource) {}

    private get repository(): Repository<Player> {
        return this.dataSource.getRepository(Player);
    }

    public async findAll(ruid: string, pagination?: {start: number, count: number}): Promise<Player[]> {
        let players: Player[] = [];
        if(pagination) {
            players = await this.repository.find({where: {ruid}, skip: pagination.start, take: pagination.count});
        } else {
            players = await this.repository.find({ where: { ruid } });
        }
        if (players.length === 0) throw new Error('There are no players.');
        return players;
    }

    public async findSingle(ruid: string, auth: string): Promise<Player | undefined> {
        const player = await this.repository.findOneBy({ ruid, auth });
        if (player === null) throw new Error('Such player is not found.');
        return player;
    }

    public async search(ruid: string, searchQuery: string, pagination: { start: number; count: number; }): Promise<Player[]> {
        const players = this.repository.find({
            where: [
                { ruid: ruid, auth: Like(`%${searchQuery}%`)},
                { ruid: ruid, name: Like(`%${searchQuery}%`)},
                { ruid: ruid, conn: Like(`%${searchQuery}%`)},
            ],
            skip: pagination.start,
            take: pagination.count
        });

        return players;
    }

    public async addSingle(ruid: string, player: PlayerModel): Promise<Player> {
        let newPlayer = await this.repository.findOneBy({ ruid, auth: player.auth });
        if (newPlayer === null) {
            newPlayer = new Player();
            newPlayer.ruid = ruid;
            newPlayer.auth = player.auth;
            newPlayer.conn = player.conn;
            newPlayer.name = player.name;
            newPlayer.mute = player.mute;
            newPlayer.muteExpire = player.muteExpire;
            newPlayer.rejoinCount = player.rejoinCount;
            newPlayer.joinDate = player.joinDate;
            newPlayer.leftDate = player.leftDate;
            newPlayer.nicknames = player.nicknames;
            newPlayer.malActCount = player.malActCount;
        } else {
            throw new Error('Such player is exist already.');
        }
        return await this.repository.save(newPlayer);
    }

    public async updateSingle(ruid: string, auth: string, player: PlayerModel): Promise<Player> {
        const newPlayer = await this.repository.findOneBy({ ruid, auth });
        if (newPlayer !== null) {
            newPlayer.ruid = ruid;
            newPlayer.auth = player.auth;
            newPlayer.conn = player.conn;
            newPlayer.name = player.name;
            newPlayer.mute = player.mute;
            newPlayer.muteExpire = player.muteExpire;
            newPlayer.rejoinCount = player.rejoinCount;
            newPlayer.joinDate = player.joinDate;
            newPlayer.leftDate = player.leftDate;
            newPlayer.nicknames = player.nicknames;
            newPlayer.malActCount = player.malActCount;
        } else {
            throw new Error('Such player is not found.');
        }
        return await this.repository.save(newPlayer);
    }

    public async deleteSingle(ruid: string, auth: string): Promise<void> {
        const player = await this.repository.findOneBy({ ruid, auth });
        if (player === null) {
            throw new Error('Such player is not found.');
        } else {
            await this.repository.remove(player);
        }
    }
}
