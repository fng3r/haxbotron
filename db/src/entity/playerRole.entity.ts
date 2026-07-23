import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class PlayerRole {
    @PrimaryGeneratedColumn()
    uid!: number;

    @Column()
    auth!: string;

    @Column()
    name!: string;

    @Column()
    role!: string;
}