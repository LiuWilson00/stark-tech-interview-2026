import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaskIndexes1704067200002 implements MigrationInterface {
  name = 'AddTaskIndexes1704067200002';

  private async getExistingIndexes(queryRunner: QueryRunner): Promise<Set<string>> {
    const indexes = await queryRunner.query(`
      SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tasks'
    `);
    // Convert to lowercase for case-insensitive comparison
    return new Set(
      indexes.map((i: { INDEX_NAME: string }) => i.INDEX_NAME.toLowerCase())
    );
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const existingIndexes = await this.getExistingIndexes(queryRunner);

    // Index on isDeleted - frequently filtered in almost all queries
    if (!existingIndexes.has('idx_tasks_is_deleted')) {
      await queryRunner.query(`CREATE INDEX idx_tasks_is_deleted ON tasks (isDeleted)`);
    }

    // Index on parentTaskId - used for subtask queries and N+1 optimization
    if (!existingIndexes.has('idx_tasks_parent_task_id')) {
      await queryRunner.query(`CREATE INDEX idx_tasks_parent_task_id ON tasks (parentTaskId)`);
    }

    // Index on teamId - frequently filtered by team
    if (!existingIndexes.has('idx_tasks_team_id')) {
      await queryRunner.query(`CREATE INDEX idx_tasks_team_id ON tasks (teamId)`);
    }

    // Index on createdAt - used for sorting and date range filtering
    if (!existingIndexes.has('idx_tasks_created_at')) {
      await queryRunner.query(`CREATE INDEX idx_tasks_created_at ON tasks (createdAt)`);
    }

    // Index on creatorId - used for "My Tasks" view filtering
    if (!existingIndexes.has('idx_tasks_creator_id')) {
      await queryRunner.query(`CREATE INDEX idx_tasks_creator_id ON tasks (creatorId)`);
    }

    // Index on status - used for status filtering
    // Note: May already exist as IDX_tasks_status from entity definition
    if (!existingIndexes.has('idx_tasks_status')) {
      await queryRunner.query(`CREATE INDEX idx_tasks_status ON tasks (status)`);
    }

    // Composite index for common query pattern: team + isDeleted
    if (!existingIndexes.has('idx_tasks_team_not_deleted')) {
      await queryRunner.query(`CREATE INDEX idx_tasks_team_not_deleted ON tasks (teamId, isDeleted)`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const existingIndexes = await this.getExistingIndexes(queryRunner);

    // Only drop indexes that we created (not FK indexes or entity-defined indexes)
    const indexesToDrop = [
      'idx_tasks_team_not_deleted',
      'idx_tasks_status',
      'idx_tasks_creator_id',
      'idx_tasks_created_at',
      'idx_tasks_team_id',
      'idx_tasks_parent_task_id',
      'idx_tasks_is_deleted',
    ];

    for (const indexName of indexesToDrop) {
      if (existingIndexes.has(indexName)) {
        await queryRunner.query(`DROP INDEX ${indexName} ON tasks`);
      }
    }
  }
}
