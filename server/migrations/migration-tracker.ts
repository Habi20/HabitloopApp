// server/migrations/migration-tracker.ts
import { db } from '../db';
import { sql } from 'drizzle-orm';

interface Migration {
  id: string;
  filename: string;
  executed_at: Date;
  checksum?: string;
}

export class MigrationTracker {
  async initializeTracker() {
    // Create migrations tracking table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS _migrations (
        id VARCHAR PRIMARY KEY,
        filename VARCHAR NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW(),
        checksum VARCHAR
      );
    `);
  }

  async recordMigration(filename: string) {
    await db.execute(sql`
      INSERT INTO _migrations (id, filename, executed_at)
      VALUES (${filename}, ${filename}, NOW())
      ON CONFLICT (id) DO NOTHING;
    `);
  }

  async getMigrationHistory(): Promise<Migration[]> {
    const result = await db.execute(sql`
      SELECT * FROM _migrations ORDER BY executed_at ASC;
    `);
    
    // Fixed: Proper type conversion with validation
    return result.rows.map(row => ({
      id: String(row.id),
      filename: String(row.filename),
      executed_at: new Date(row.executed_at as string),
      checksum: row.checksum ? String(row.checksum) : undefined
    }));
  }

  async isMigrationExecuted(filename: string): Promise<boolean> {
    const result = await db.execute(sql`
      SELECT 1 FROM _migrations WHERE filename = ${filename};
    `);
    return result.rows.length > 0;
  }
}

export const migrationTracker = new MigrationTracker();
