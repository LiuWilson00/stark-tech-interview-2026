import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1704067200000 implements MigrationInterface {
  name = 'InitialSchema1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users table
    await queryRunner.query(`
      CREATE TABLE \`users\` (
        \`id\` varchar(36) NOT NULL,
        \`email\` varchar(255) NOT NULL,
        \`passwordHash\` varchar(255) NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`avatarUrl\` varchar(255) NULL,
        \`isActive\` tinyint NOT NULL DEFAULT 1,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_users_email\` (\`email\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Teams table
    await queryRunner.query(`
      CREATE TABLE \`teams\` (
        \`id\` varchar(36) NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`description\` text NULL,
        \`ownerId\` varchar(36) NOT NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`FK_teams_owner\` (\`ownerId\`),
        CONSTRAINT \`FK_teams_owner\` FOREIGN KEY (\`ownerId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Team members table
    await queryRunner.query(`
      CREATE TABLE \`team_members\` (
        \`id\` varchar(36) NOT NULL,
        \`teamId\` varchar(36) NOT NULL,
        \`userId\` varchar(36) NOT NULL,
        \`role\` enum('owner', 'admin', 'member') NOT NULL DEFAULT 'member',
        \`joinedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_team_members_team_user\` (\`teamId\`, \`userId\`),
        KEY \`FK_team_members_user\` (\`userId\`),
        CONSTRAINT \`FK_team_members_team\` FOREIGN KEY (\`teamId\`) REFERENCES \`teams\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_team_members_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Tasks table
    await queryRunner.query(`
      CREATE TABLE \`tasks\` (
        \`id\` varchar(36) NOT NULL,
        \`title\` varchar(255) NOT NULL,
        \`description\` text NULL,
        \`teamId\` varchar(36) NULL,
        \`creatorId\` varchar(36) NOT NULL,
        \`parentTaskId\` varchar(36) NULL,
        \`status\` enum('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'pending',
        \`priority\` enum('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
        \`dueDate\` timestamp NULL,
        \`completedAt\` timestamp NULL,
        \`isDeleted\` tinyint NOT NULL DEFAULT 0,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`FK_tasks_team\` (\`teamId\`),
        KEY \`FK_tasks_creator\` (\`creatorId\`),
        KEY \`FK_tasks_parent\` (\`parentTaskId\`),
        KEY \`IDX_tasks_status\` (\`status\`),
        KEY \`IDX_tasks_due_date\` (\`dueDate\`),
        CONSTRAINT \`FK_tasks_team\` FOREIGN KEY (\`teamId\`) REFERENCES \`teams\` (\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`FK_tasks_creator\` FOREIGN KEY (\`creatorId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_tasks_parent\` FOREIGN KEY (\`parentTaskId\`) REFERENCES \`tasks\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Task assignees table
    await queryRunner.query(`
      CREATE TABLE \`task_assignees\` (
        \`id\` varchar(36) NOT NULL,
        \`taskId\` varchar(36) NOT NULL,
        \`userId\` varchar(36) NOT NULL,
        \`isCompleted\` tinyint NOT NULL DEFAULT 0,
        \`assignedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_task_assignees_task_user\` (\`taskId\`, \`userId\`),
        KEY \`FK_task_assignees_user\` (\`userId\`),
        CONSTRAINT \`FK_task_assignees_task\` FOREIGN KEY (\`taskId\`) REFERENCES \`tasks\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_task_assignees_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Task followers table
    await queryRunner.query(`
      CREATE TABLE \`task_followers\` (
        \`id\` varchar(36) NOT NULL,
        \`taskId\` varchar(36) NOT NULL,
        \`userId\` varchar(36) NOT NULL,
        \`followedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_task_followers_task_user\` (\`taskId\`, \`userId\`),
        KEY \`FK_task_followers_user\` (\`userId\`),
        CONSTRAINT \`FK_task_followers_task\` FOREIGN KEY (\`taskId\`) REFERENCES \`tasks\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_task_followers_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Comments table
    await queryRunner.query(`
      CREATE TABLE \`comments\` (
        \`id\` varchar(36) NOT NULL,
        \`taskId\` varchar(36) NOT NULL,
        \`userId\` varchar(36) NOT NULL,
        \`content\` text NOT NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`FK_comments_task\` (\`taskId\`),
        KEY \`FK_comments_user\` (\`userId\`),
        CONSTRAINT \`FK_comments_task\` FOREIGN KEY (\`taskId\`) REFERENCES \`tasks\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_comments_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Task histories table
    await queryRunner.query(`
      CREATE TABLE \`task_histories\` (
        \`id\` varchar(36) NOT NULL,
        \`taskId\` varchar(36) NOT NULL,
        \`userId\` varchar(36) NOT NULL,
        \`actionType\` enum('created', 'updated', 'status_changed', 'assignee_added', 'assignee_removed', 'follower_added', 'follower_removed', 'comment_added', 'completed') NOT NULL,
        \`oldValue\` json NULL,
        \`newValue\` json NULL,
        \`description\` text NOT NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`FK_task_histories_task\` (\`taskId\`),
        KEY \`FK_task_histories_user\` (\`userId\`),
        KEY \`IDX_task_histories_action_type\` (\`actionType\`),
        CONSTRAINT \`FK_task_histories_task\` FOREIGN KEY (\`taskId\`) REFERENCES \`tasks\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_task_histories_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`task_histories\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`comments\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`task_followers\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`task_assignees\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`tasks\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`team_members\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`teams\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`users\``);
  }
}
