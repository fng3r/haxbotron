import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Player {
    @PrimaryGeneratedColumn()
    uid!: number;

    @Column()
    ruid!: string;

    @Column()
    auth!: string; 

    @Column()
    conn!: string; 

    @Column()
    name!: string;

    @Column()
    mute!: boolean; 

    @Column()
    muteExpire!: number; 

    @Column()
    rejoinCount!: number; 

    @Column()
    joinDate!: number;

    @Column()
    leftDate!: number; 

    @Column()
    malActCount!: number; 
}