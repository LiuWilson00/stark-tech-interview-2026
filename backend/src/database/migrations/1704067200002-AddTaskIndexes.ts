import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaskIndexes1704067200002 implements MigrationInterface {
  name = 'AddTaskIndexes1704067200002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Index on isDeleted - frequently filtered in almost all queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_tasks_is_deleted" ON "tasks" ("isDeleted")
    `);

    // Index on parentTaskId - used for subtask queries and N+1 optimization
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_tasks_parent_task_id" ON "tasks" ("parentTaskId")
    `);

    // Index on teamId - frequently filtered by team
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_tasks_team_id" ON "tasks" ("teamId")
    `);

    // Index on createdAt - used for sorting and date range filtering
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_tasks_created_at" ON "tasks" ("createdAt")
    `);

    // Index on creatorId - used for "My Tasks" view filtering
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_tasks_creator_id" ON "tasks" ("creatorId")
    `);

    // Composite index for common query pattern: non-deleted tasks by team
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_tasks_team_not_deleted" ON "tasks" ("teamId", "isDeleted")
      WHERE "isDeleted" = false
    `);

    // Index on status - used for status filtering
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_tasks_status" ON "tasks" ("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_tasks_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_tasks_team_not_deleted"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_tasks_creator_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_tasks_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_tasks_team_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_tasks_parent_task_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_tasks_is_deleted"`);
  }
}
