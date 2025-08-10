import { db } from '../../db';
import { sql } from 'drizzle-orm';

async function recordManualMigration() {
  try {
    await db.execute(sql`
      INSERT INTO _migrations (id, filename, executed_at) 
      VALUES ('manual_rbac_schema_fix', 'manual_rbac_schema_fix.sql', NOW())
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Manual migration recorded in tracking system');
  } catch (error) {
    console.error('❌ Error recording manual migration:', error);
  }
  process.exit(0);
}

recordManualMigration();
