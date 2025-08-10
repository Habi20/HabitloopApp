import { db } from '../../db';
import { sql } from 'drizzle-orm';

async function checkMigrations() {
  try {
    const migrations = await db.execute(sql`SELECT * FROM _migrations ORDER BY executed_at`);
    console.log('Migration entries:', migrations.rows);
    console.log('Total migrations in _migrations table:', migrations.rows.length);
  } catch (error: unknown) {
    console.error('Error querying _migrations table:', error instanceof Error ? error.message : error);
  }
  process.exit(0);
}

checkMigrations();
