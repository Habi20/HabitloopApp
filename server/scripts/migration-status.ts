// server/scripts/migration-status.ts
import { migrationTracker } from '../migrations/migration-tracker';
import { env } from '../env';

async function showMigrationStatus() {
  console.log('📍 Environment:', env.nodeEnv); // ← Add environment info
  console.log('📍 Database URL configured:', env.dbUrl ? 'Yes ✅' : 'No ❌');
  
  try {
    await migrationTracker.initializeTracker();
    const history = await migrationTracker.getMigrationHistory();
    
    console.log('📊 Migration Status:');
    console.log('═══════════════════════════════════════════');
    
    if (history.length === 0) {
      console.log('No migrations executed yet.');
    } else {
      history.forEach((migration, index) => {
        console.log(`${index + 1}. ${migration.filename} (${migration.executed_at})`);
      });
    }
    
    console.log('═══════════════════════════════════════════');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration status check failed:', error);
    process.exit(1);
  }
}

showMigrationStatus();
