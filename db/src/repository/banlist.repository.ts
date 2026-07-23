import type { Repository } from "typeorm";
import { appDataSource } from "../dataSource.js";
import { BanList } from "../entity/banlist.entity.js";
import type { BanListModel } from "../model/BanListModel.js";
import type { IRepository } from "./repository.interface.js";

export class BanListRepository implements IRepository<BanList> {
    public constructor(private readonly dataSource = appDataSource) {}

    private get repository(): Repository<BanList> {
        return this.dataSource.getRepository(BanList);
    }

    public async findAll(ruid: string, pagination?: {start: number, count: number}): Promise<BanList[]> {
        let banlist: BanList[] = [];
        if(pagination) {
            banlist = await this.repository.find({where: {ruid}, skip: pagination.start, take: pagination.count});
        } else {
            banlist = await this.repository.find({ where: { ruid } });
        }
        return banlist;
    }

    public async findSingle(ruid: string, conn: string): Promise<BanList | undefined> {
        const banPlayer = await this.repository.findOneBy({ ruid, conn });
        if (banPlayer === null) throw new Error('Such player is not banned.');
        return banPlayer;
    }

    public async addSingle(ruid: string, banlist: BanListModel): Promise<BanList> {
        let newBan = await this.repository.findOneBy({ ruid, conn: banlist.conn });
        if (newBan === null) {
            newBan = new BanList();
            newBan.ruid = ruid;
            newBan.conn = banlist.conn;
            newBan.auth = banlist.auth;
            newBan.reason = banlist.reason;
            newBan.register = banlist.register;
            newBan.expire = banlist.expire;
        } else {
            throw new Error('Such player is already banned.');
        }
        return await this.repository.save(newBan);
    }

    public async updateSingle(ruid: string, conn: string, banlist: BanListModel): Promise<BanList> {
        const newBan = await this.repository.findOneBy({ ruid, conn });
        if (newBan !== null) {
            newBan.ruid = ruid;
            newBan.conn = banlist.conn;
            newBan.auth = banlist.auth;
            newBan.reason = banlist.reason;
            newBan.register = banlist.register;
            newBan.expire = banlist.expire;
        } else {
            throw new Error('Such player is not banned yet.');
        }
        return await this.repository.save(newBan);
    }

    public async deleteSingle(ruid: string, conn: string): Promise<void> {
        const banPlayer = await this.repository.findOneBy({ ruid, conn });
        if (banPlayer === null) {
            throw new Error('Such player is not banned yet.');
        } else {
            await this.repository.remove(banPlayer);
        }
    }
}
