import { db } from '../../db';
import { sql } from 'drizzle-orm';

async function checkMigrationRecords() {
  try {
    const migrations = await db.execute(sql`
      SELECT id, filename, executed_at 
      FROM _migrations 
      ORDER BY executed_at;
    `);
    console.log('📊 Migration records in database:');
    migrations.rows.forEach((m, i) => {
      console.log(`  ${i+1}. ${m.filename} (executed: ${m.executed_at})`);
    });
  } catch (error) {
    console.error('❌ Error checking migrations:', error);
  }
  process.exit(0);
}

checkMigrationRecords();
