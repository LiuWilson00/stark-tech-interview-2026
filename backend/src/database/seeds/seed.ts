import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../data-source';
import { SeedRunner } from './seed-runner';

// Import all seeds in order
import { DemoDataSeed } from './1704067200000-DemoData';

// Register seeds in execution order
const seeds = [DemoDataSeed];

async function runSeeds() {
  console.log('🌱 Starting database seeding...\n');

  const dataSource = new DataSource(dataSourceOptions);
  await dataSource.initialize();

  // Run pending migrations first
  console.log('📦 Checking migrations...');
  const pendingMigrations = await dataSource.showMigrations();
  if (pendingMigrations) {
    console.log('   Running pending migrations...');
    await dataSource.runMigrations();
    console.log('   ✅ Migrations completed\n');
  } else {
    console.log('   ✅ All migrations are up to date\n');
  }

  try {
    const runner = new SeedRunner(dataSource);
    const executedSeeds = await runner.getExecutedSeeds();

    if (executedSeeds.length > 0) {
      console.log('📋 Previously executed seeds:');
      executedSeeds.forEach((name) => console.log(`   • ${name}`));
      console.log('');
    }

    console.log('🚀 Running seeds...');
    await runner.run(seeds);

    console.log('\n✨ Database seeding completed!\n');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

runSeeds().catch((error) => {
  console.error(error);
  process.exit(1);
});
