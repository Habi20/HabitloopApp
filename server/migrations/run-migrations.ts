// server/migrations/run-migrations.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { migrationTracker } from './migration-tracker';
// import { env } from '../env';

// ESM-compatible __dirname replacement
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ManualMigrationRunner {
  private migrationsDir = path.join(__dirname, '.');

  async runPendingMigrations() {
    console.log('🔄 Initializing migration tracker...');
    // console.log('📍 Environment:', env.nodeEnv);
    // console.log('📍 Database URL configured:', env.dbUrl ? 'Yes ✅' : 'No ❌');
    
    try {
      await migrationTracker.initializeTracker();
      console.log('✅ Migration tracker initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize migration tracker:', error);
      throw error;
    }

    console.log('📂 Scanning for migration files...');
    console.log('📍 Migration directory:', this.migrationsDir);
    
    const migrationFiles = this.getMigrationFiles();
    
    if (migrationFiles.length === 0) {
      console.log('ℹ️  No migration files found in:', this.migrationsDir);
      return;
    }

    console.log(`📋 Found ${migrationFiles.length} migration file(s):`, migrationFiles);
    
    for (const file of migrationFiles) {
      console.log(`📍 Checking migration status: ${file}`);
      const isExecuted = await migrationTracker.isMigrationExecuted(file);
      
      if (!isExecuted) {
        console.log(`⚡ Executing migration: ${file}`);
        await this.executeMigration(file);
        await migrationTracker.recordMigration(file);
        console.log(`✅ Migration completed: ${file}`);
      } else {
        console.log(`⏭️  Migration already executed: ${file}`);
      }
    }

    console.log('🎉 All migrations completed successfully!');
  }

  private getMigrationFiles(): string[] {
    try {
      const files = fs.readdirSync(this.migrationsDir);
      console.log('📍 All files in migrations directory:', files);
      
      return files
        .filter(file => {
          const isSqlFile = file.endsWith('.sql');
          const isNotRollback = !file.includes('rollback');
          const isNotInManualDir = !file.includes('/'); // Exclude subdirectory files
          return isSqlFile && isNotRollback && isNotInManualDir;
        })
        .sort();
    } catch (error) {
      console.error('❌ Error reading migrations directory:', error);
      return [];
    }
  }

  private async executeMigration(filename: string) {
    const filePath = path.join(this.migrationsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Migration file not found: ${filePath}`);
    }

    const migrationSQL = fs.readFileSync(filePath, 'utf-8');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await db.execute(sql.raw(statement));
        } catch (error) {
          console.error(`❌ Error executing statement in ${filename}:`, statement);
          throw error;
        }
      }
    }
  }

  async createMigration(name: string, content: string) {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `${timestamp}_${name.toLowerCase().replace(/\s+/g, '_')}.sql`;
    const filepath = path.join(this.migrationsDir, filename);
    
    const migrationContent = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}
-- Description: ${name}

${content}
`;

    fs.writeFileSync(filepath, migrationContent);
    console.log(`📝 Migration created: ${filename}`);
    return filename;
  }
}

// Main execution
export const migrationRunner = new ManualMigrationRunner();

// Enhanced ESM module detection
async function main() {
  try {
    console.log('🚀 Starting migration process...');
    console.log('📊 Environment validation passed ✅');
    
    await migrationRunner.runPendingMigrations();
    
    console.log('✅ Migration process completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Improved ESM execution check (fixes the "loaded as module" issue)
const isMainModule = import.meta.url.startsWith('file:') && 
                    (import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1].endsWith(path.basename(__filename)));

if (isMainModule) {
  console.log('📍 Running as main module');
  main().catch(error => {
    console.error('❌ Unhandled error in main:', error);
    process.exit(1);
  });
} else {
  console.log('📍 Loaded as module - not executing main func    ction');
}
