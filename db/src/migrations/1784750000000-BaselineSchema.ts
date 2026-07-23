import type { MigrationInterface, QueryRunner } from "typeorm";

export class BaselineSchema1784750000000 implements MigrationInterface {
    public readonly name = "BaselineSchema1784750000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "player" (
                "uid" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "ruid" varchar NOT NULL,
                "auth" varchar NOT NULL,
                "conn" varchar NOT NULL,
                "name" varchar NOT NULL,
                "mute" boolean NOT NULL,
                "muteExpire" integer NOT NULL,
                "rejoinCount" integer NOT NULL,
                "joinDate" integer NOT NULL,
                "leftDate" integer NOT NULL,
                "malActCount" integer NOT NULL,
                "nicknames" text NOT NULL DEFAULT ('')
            )
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "player_role" (
                "uid" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "auth" varchar NOT NULL,
                "name" varchar NOT NULL,
                "role" varchar NOT NULL
            )
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "player_role_event" (
                "uid" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "type" varchar NOT NULL,
                "auth" varchar NOT NULL,
                "name" varchar NOT NULL,
                "role" varchar NOT NULL,
                "timestamp" integer NOT NULL
            )
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "ban_list" (
                "uid" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "ruid" varchar NOT NULL,
                "conn" varchar NOT NULL,
                "auth" varchar NOT NULL,
                "reason" varchar NOT NULL DEFAULT (''),
                "register" integer NOT NULL,
                "expire" integer NOT NULL
            )
        `);
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // This baseline also registers pre-existing databases. It must not drop their tables on revert.
    }
}
