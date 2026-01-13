import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Seed } from './seed-runner';

interface SeedUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
}

interface SeedTeam {
  id: string;
  name: string;
  description: string;
  ownerId: string;
}

interface SeedTask {
  id: string;
  title: string;
  description: string | null;
  teamId: string;
  creatorId: string;
  status: string;
  priority: string;
  dueDate: Date | null;
}

export const DemoDataSeed: Seed = {
  name: '1704067200000-DemoData',

  async run(dataSource: DataSource): Promise<void> {
    // ============================================
    // Create Users
    // ============================================
    console.log('👤 Creating users...');
    const passwordHash = await bcrypt.hash('Password123!', 10);

    const users: SeedUser[] = [
      {
        id: uuidv4(),
        email: 'tony@stark.com',
        passwordHash,
        name: 'Tony Stark',
      },
      {
        id: uuidv4(),
        email: 'steve@avengers.com',
        passwordHash,
        name: 'Steve Rogers',
      },
      {
        id: uuidv4(),
        email: 'natasha@shield.com',
        passwordHash,
        name: 'Natasha Romanoff',
      },
      {
        id: uuidv4(),
        email: 'bruce@stark.com',
        passwordHash,
        name: 'Bruce Banner',
      },
      {
        id: uuidv4(),
        email: 'peter@dailybugle.com',
        passwordHash,
        name: 'Peter Parker',
      },
    ];

    for (const user of users) {
      await dataSource.query(
        `INSERT INTO users (id, email, passwordHash, name) VALUES (?, ?, ?, ?)`,
        [user.id, user.email, user.passwordHash, user.name],
      );
    }
    console.log(`      Created ${users.length} users`);

    // ============================================
    // Create Teams
    // ============================================
    console.log('👥 Creating teams...');

    const teams: SeedTeam[] = [
      {
        id: uuidv4(),
        name: 'Avengers',
        description: "Earth's Mightiest Heroes",
        ownerId: users[0].id, // Tony
      },
      {
        id: uuidv4(),
        name: 'Stark Industries R&D',
        description: 'Research and Development team',
        ownerId: users[0].id, // Tony
      },
      {
        id: uuidv4(),
        name: 'SHIELD Operations',
        description: 'Strategic Homeland Intervention',
        ownerId: users[2].id, // Natasha
      },
    ];

    for (const team of teams) {
      await dataSource.query(
        `INSERT INTO teams (id, name, description, ownerId) VALUES (?, ?, ?, ?)`,
        [team.id, team.name, team.description, team.ownerId],
      );
    }
    console.log(`      Created ${teams.length} teams`);

    // ============================================
    // Add Team Members
    // ============================================
    console.log('🤝 Adding team members...');

    const teamMembers = [
      // Avengers team
      { teamId: teams[0].id, userId: users[0].id, role: 'owner' },
      { teamId: teams[0].id, userId: users[1].id, role: 'admin' },
      { teamId: teams[0].id, userId: users[2].id, role: 'member' },
      { teamId: teams[0].id, userId: users[3].id, role: 'member' },
      // Stark R&D team
      { teamId: teams[1].id, userId: users[0].id, role: 'owner' },
      { teamId: teams[1].id, userId: users[3].id, role: 'admin' },
      { teamId: teams[1].id, userId: users[4].id, role: 'member' },
      // SHIELD team
      { teamId: teams[2].id, userId: users[2].id, role: 'owner' },
      { teamId: teams[2].id, userId: users[1].id, role: 'member' },
    ];

    for (const member of teamMembers) {
      await dataSource.query(
        `INSERT INTO team_members (id, teamId, userId, role) VALUES (?, ?, ?, ?)`,
        [uuidv4(), member.teamId, member.userId, member.role],
      );
    }
    console.log(`      Added ${teamMembers.length} team memberships`);

    // ============================================
    // Create Tasks
    // ============================================
    console.log('📋 Creating tasks...');

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const tasks: SeedTask[] = [
      // Avengers tasks
      {
        id: uuidv4(),
        title: 'Upgrade Iron Man suit to Mark 50',
        description: 'Implement nano-technology integration',
        teamId: teams[0].id,
        creatorId: users[0].id,
        status: 'in_progress',
        priority: 'high',
        dueDate: nextWeek,
      },
      {
        id: uuidv4(),
        title: 'Team training session',
        description: 'Weekly combat training at the compound',
        teamId: teams[0].id,
        creatorId: users[1].id,
        status: 'pending',
        priority: 'medium',
        dueDate: tomorrow,
      },
      {
        id: uuidv4(),
        title: 'Review security protocols',
        description: 'Update security measures after last incident',
        teamId: teams[0].id,
        creatorId: users[2].id,
        status: 'pending',
        priority: 'urgent',
        dueDate: tomorrow,
      },
      // Stark R&D tasks
      {
        id: uuidv4(),
        title: 'Arc reactor efficiency research',
        description: 'Improve energy output by 15%',
        teamId: teams[1].id,
        creatorId: users[0].id,
        status: 'in_progress',
        priority: 'high',
        dueDate: nextMonth,
      },
      {
        id: uuidv4(),
        title: 'Gamma radiation containment',
        description: 'Design safer containment protocols',
        teamId: teams[1].id,
        creatorId: users[3].id,
        status: 'pending',
        priority: 'medium',
        dueDate: nextWeek,
      },
      {
        id: uuidv4(),
        title: 'Web shooter improvement',
        description: 'Increase web fluid capacity',
        teamId: teams[1].id,
        creatorId: users[4].id,
        status: 'completed',
        priority: 'low',
        dueDate: null,
      },
      // SHIELD tasks
      {
        id: uuidv4(),
        title: 'Intelligence briefing preparation',
        description: 'Prepare briefing for upcoming mission',
        teamId: teams[2].id,
        creatorId: users[2].id,
        status: 'pending',
        priority: 'high',
        dueDate: tomorrow,
      },
      {
        id: uuidv4(),
        title: 'Agent recruitment review',
        description: 'Review new agent applications',
        teamId: teams[2].id,
        creatorId: users[2].id,
        status: 'in_progress',
        priority: 'medium',
        dueDate: nextWeek,
      },
    ];

    for (const task of tasks) {
      await dataSource.query(
        `INSERT INTO tasks (id, title, description, teamId, creatorId, status, priority, dueDate)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          task.id,
          task.title,
          task.description,
          task.teamId,
          task.creatorId,
          task.status,
          task.priority,
          task.dueDate,
        ],
      );
    }
    console.log(`      Created ${tasks.length} tasks`);

    // ============================================
    // Add Task Assignees
    // ============================================
    console.log('👷 Assigning tasks...');

    const assignees = [
      { taskId: tasks[0].id, userId: users[0].id },
      { taskId: tasks[0].id, userId: users[3].id },
      { taskId: tasks[1].id, userId: users[0].id },
      { taskId: tasks[1].id, userId: users[1].id },
      { taskId: tasks[1].id, userId: users[2].id },
      { taskId: tasks[2].id, userId: users[2].id },
      { taskId: tasks[3].id, userId: users[0].id },
      { taskId: tasks[3].id, userId: users[3].id },
      { taskId: tasks[4].id, userId: users[3].id },
      { taskId: tasks[5].id, userId: users[4].id },
      { taskId: tasks[6].id, userId: users[2].id },
      { taskId: tasks[7].id, userId: users[2].id },
      { taskId: tasks[7].id, userId: users[1].id },
    ];

    for (const assignee of assignees) {
      await dataSource.query(
        `INSERT INTO task_assignees (id, taskId, userId) VALUES (?, ?, ?)`,
        [uuidv4(), assignee.taskId, assignee.userId],
      );
    }
    console.log(`      Added ${assignees.length} task assignments`);

    // ============================================
    // Add Task Followers
    // ============================================
    console.log('👀 Adding task followers...');

    const followers = [
      { taskId: tasks[0].id, userId: users[1].id },
      { taskId: tasks[0].id, userId: users[4].id },
      { taskId: tasks[2].id, userId: users[0].id },
      { taskId: tasks[3].id, userId: users[4].id },
      { taskId: tasks[6].id, userId: users[1].id },
    ];

    for (const follower of followers) {
      await dataSource.query(
        `INSERT INTO task_followers (id, taskId, userId) VALUES (?, ?, ?)`,
        [uuidv4(), follower.taskId, follower.userId],
      );
    }
    console.log(`      Added ${followers.length} task followers`);

    // ============================================
    // Add Comments
    // ============================================
    console.log('💬 Adding comments...');

    const comments = [
      {
        taskId: tasks[0].id,
        userId: users[3].id,
        content:
          'I can help with the nanotech integration. Let me run some simulations.',
      },
      {
        taskId: tasks[0].id,
        userId: users[0].id,
        content: "Great, Bruce. Let's sync up tomorrow morning.",
      },
      {
        taskId: tasks[1].id,
        userId: users[1].id,
        content: "I've prepared the training schedule. Please review.",
      },
      {
        taskId: tasks[2].id,
        userId: users[0].id,
        content: "What's the status on this? It's marked urgent.",
      },
      {
        taskId: tasks[2].id,
        userId: users[2].id,
        content: 'Working on it. Will have the report ready by EOD.',
      },
      {
        taskId: tasks[4].id,
        userId: users[0].id,
        content: 'Make sure to coordinate with the safety team.',
      },
    ];

    for (const comment of comments) {
      await dataSource.query(
        `INSERT INTO comments (id, taskId, userId, content) VALUES (?, ?, ?, ?)`,
        [uuidv4(), comment.taskId, comment.userId, comment.content],
      );
    }
    console.log(`      Added ${comments.length} comments`);

    // ============================================
    // Add Task History
    // ============================================
    console.log('📜 Adding task history...');

    for (const task of tasks) {
      await dataSource.query(
        `INSERT INTO task_histories (id, taskId, userId, actionType, description) VALUES (?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          task.id,
          task.creatorId,
          'created',
          `Task "${task.title}" was created`,
        ],
      );
    }
    console.log(`      Added ${tasks.length} history entries`);

    console.log('\n📝 Demo accounts created:');
    console.log('   Email: tony@stark.com');
    console.log('   Email: steve@avengers.com');
    console.log('   Email: natasha@shield.com');
    console.log('   Email: bruce@stark.com');
    console.log('   Email: peter@dailybugle.com');
    console.log('   Password (all accounts): Password123!');
  },
};
