import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class RoomConfig {
    @PrimaryColumn()
    ruid!: string;

    @Column("simple-json")
    config!: Record<string, unknown>;

    @Column()
    createdAt!: number;

    @Column()
    updatedAt!: number;
}
