import {Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable} from "typeorm";

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

    @Column("simple-array", {default: ""})
    nicknames!: string[];

    @Column()
    malActCount!: number; 
}

@Entity()
export class PlayerNickname {
    @PrimaryGeneratedColumn()
    uid!: number;

    @Column()
    nickname!: string
}