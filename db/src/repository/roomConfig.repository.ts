import type { DataSource, Repository } from "typeorm";
import { appDataSource } from "../dataSource.js";
import { RoomConfig } from "../entity/roomConfig.entity.js";

export class RoomConfigRepository {
    public constructor(private readonly dataSource: DataSource = appDataSource) {}

    private get repository(): Repository<RoomConfig> {
        return this.dataSource.getRepository(RoomConfig);
    }

    public findAll(): Promise<RoomConfig[]> {
        return this.repository.find({ order: { ruid: "ASC" } });
    }

    public findOne(ruid: string): Promise<RoomConfig | null> {
        return this.repository.findOneBy({ ruid });
    }

    public async upsert(ruid: string, config: Record<string, unknown>): Promise<RoomConfig> {
        const now = Date.now();
        const existing = await this.findOne(ruid);
        return this.repository.save({
            ruid,
            config,
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
        });
    }

    public async delete(ruid: string): Promise<boolean> {
        return (await this.repository.delete({ ruid })).affected === 1;
    }
}
