import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedHistory1704067200001 implements MigrationInterface {
  name = 'SeedHistory1704067200001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Seed history table - tracks which seeds have been executed (like migrations)
    await queryRunner.query(`
      CREATE TABLE \`seed_history\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(255) NOT NULL,
        \`executedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_seed_history_name\` (\`name\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`seed_history\``);
  }
}
