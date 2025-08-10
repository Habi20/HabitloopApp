import { db } from '../../db';
import { sql } from 'drizzle-orm';

async function cleanupFailedMigration() {
  try {
    // Remove the failed migration record
    await db.execute(sql`
      DELETE FROM _migrations WHERE filename = '20250730_add_missing_columns_simple.sql';
    `);
    
    // Drop any partially created tables
    await db.execute(sql`DROP TABLE IF EXISTS role_permissions CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS user_permissions CASCADE;`);
    
    console.log('✅ Cleaned up failed migration state');
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
  process.exit(0);
}

cleanupFailedMigration();
