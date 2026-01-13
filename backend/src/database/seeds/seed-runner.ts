import { DataSource } from 'typeorm';

export interface Seed {
  name: string;
  run(dataSource: DataSource): Promise<void>;
}

export class SeedRunner {
  constructor(private dataSource: DataSource) {}

  async getExecutedSeeds(): Promise<string[]> {
    try {
      const result = await this.dataSource.query(
        'SELECT name FROM seed_history ORDER BY executedAt',
      );
      return result.map((row: { name: string }) => row.name);
    } catch {
      // Table might not exist yet (before migration runs)
      return [];
    }
  }

  async markAsExecuted(seedName: string): Promise<void> {
    await this.dataSource.query(
      'INSERT INTO seed_history (name) VALUES (?)',
      [seedName],
    );
  }

  async run(seeds: Seed[]): Promise<void> {
    const executedSeeds = await this.getExecutedSeeds();

    for (const seed of seeds) {
      if (executedSeeds.includes(seed.name)) {
        console.log(`   ⏭️  Skipping "${seed.name}" (already executed)`);
        continue;
      }

      console.log(`   ▶️  Running "${seed.name}"...`);
      try {
        await seed.run(this.dataSource);
        await this.markAsExecuted(seed.name);
        console.log(`   ✅ Completed "${seed.name}"`);
      } catch (error) {
        console.error(`   ❌ Failed "${seed.name}":`, error);
        throw error;
      }
    }
  }
}
