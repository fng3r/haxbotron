import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

export enum PlayerRoleEventType {
    addRole = 'addrole',
    removeRole = 'rmrole',
    updateRole = 'updaterole'
}

@Entity()
export class PlayerRoleEvent {
    @PrimaryGeneratedColumn()
    uid!: number;

    @Column()
    type!: string;

    @Column()
    auth!: string;

    @Column()
    name!: string;

    @Column()
    role!: string;

    @Column()
    timestamp!: number;
}