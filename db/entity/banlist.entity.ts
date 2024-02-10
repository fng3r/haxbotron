import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class BanList {
    @PrimaryGeneratedColumn()
    uid!: number;

    @Column()
    ruid!: string;

    @Column()
    conn!: string; 

    @Column({
        default: ''
    })
    reason!: string;

    @Column()
    register!: number; 

    @Column()
    expire!: number; 
}