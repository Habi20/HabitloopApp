// server/scripts/create-migration.ts
import { migrationRunner } from '../migrations/run-migrations';
import { env } from '../env'; // ← Add this import

const migrationName = process.argv[2];
const migrationContent = process.argv[3] || '-- Add your SQL here';

if (!migrationName) {
  console.error('❌ Please provide a migration name');
  console.log('Usage: npm run migrate:create "add_user_preferences"');
  process.exit(1);
}

console.log('📍 Environment:', env.nodeEnv); // ← Add environment info
migrationRunner.createMigration(migrationName, migrationContent);
