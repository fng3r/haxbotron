import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddRoomConfigs1784751000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "room_config" ("ruid" varchar PRIMARY KEY NOT NULL, "config" text NOT NULL, "createdAt" integer NOT NULL, "updatedAt" integer NOT NULL)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "room_config"`);
    }
}
