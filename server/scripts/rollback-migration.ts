// server/scripts/rollback-migration.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { migrationTracker } from '../migrations/migration-tracker';

// ESM-compatible __dirname replacement
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class MigrationRollback {
  private migrationsDir = path.join(__dirname, '../migrations');

  async rollbackLastMigration() {
    console.log('🔄 Checking migration history...');
    
    const history = await migrationTracker.getMigrationHistory();
    
    if (history.length === 0) {
      console.log('ℹ️  No migrations to rollback.');
      return;
    }

    const lastMigration = history[history.length - 1];
    console.log(`⚠️  Rolling back migration: ${lastMigration.filename}`);
    
    // Check if rollback file exists
    const rollbackFile = this.getRollbackFilename(lastMigration.filename);
    const rollbackPath = path.join(this.migrationsDir, 'rollbacks', rollbackFile);
    
    if (fs.existsSync(rollbackPath)) {
      await this.executeRollback(rollbackPath);
      await this.removeMigrationRecord(lastMigration.filename);
      console.log(`✅ Rollback completed: ${lastMigration.filename}`);
    } else {
      console.log(`⚠️  No rollback file found: ${rollbackFile}`);
      console.log('Creating template rollback file...');
      await this.createRollbackTemplate(lastMigration.filename);
    }
  }

  async rollbackToMigration(targetMigration: string) {
    console.log(`🔄 Rolling back to migration: ${targetMigration}`);
    
    const history = await migrationTracker.getMigrationHistory();
    const targetIndex = history.findIndex(m => m.filename === targetMigration);
    
    if (targetIndex === -1) {
      console.error(`❌ Migration not found: ${targetMigration}`);
      return;
    }

    // Rollback migrations in reverse order
    const migrationsToRollback = history.slice(targetIndex + 1).reverse();
    
    for (const migration of migrationsToRollback) {
      console.log(`⚡ Rolling back: ${migration.filename}`);
      
      const rollbackFile = this.getRollbackFilename(migration.filename);
      const rollbackPath = path.join(this.migrationsDir, 'rollbacks', rollbackFile);
      
      if (fs.existsSync(rollbackPath)) {
        await this.executeRollback(rollbackPath);
        await this.removeMigrationRecord(migration.filename);
        console.log(`✅ Rolled back: ${migration.filename}`);
      } else {
        console.log(`⚠️  No rollback file for: ${migration.filename}`);
      }
    }
    
    console.log('🎉 Rollback completed!');
  }

  private getRollbackFilename(migrationFilename: string): string {
    return migrationFilename.replace('.sql', '_rollback.sql');
  }

  private async executeRollback(rollbackPath: string) {
    const rollbackSQL = fs.readFileSync(rollbackPath, 'utf-8');
    
    // Split by semicolon and execute each statement
    const statements = rollbackSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await db.execute(sql.raw(statement));
        } catch (error) {
          console.error(`❌ Error executing rollback statement:`, statement);
          throw error;
        }
      }
    }
  }

  private async removeMigrationRecord(filename: string) {
    await db.execute(sql`
      DELETE FROM _migrations WHERE filename = ${filename};
    `);
  }

  private async createRollbackTemplate(migrationFilename: string) {
    const rollbackDir = path.join(this.migrationsDir, 'rollbacks');
    
    // Create rollbacks directory if it doesn't exist
    if (!fs.existsSync(rollbackDir)) {
      fs.mkdirSync(rollbackDir, { recursive: true });
    }

    const rollbackFilename = this.getRollbackFilename(migrationFilename);
    const rollbackPath = path.join(rollbackDir, rollbackFilename);
    
    const template = `-- Rollback for: ${migrationFilename}
-- Created: ${new Date().toISOString()}
-- 
-- IMPORTANT: This is a template. Add the actual rollback SQL below.
-- Common rollback operations:
--   - DROP TABLE IF EXISTS table_name;
--   - ALTER TABLE table_name DROP COLUMN column_name;
--   - DELETE FROM table_name WHERE condition;
--
-- TODO: Add rollback SQL here

-- Example rollback statements:
-- DROP TABLE IF EXISTS new_table;
-- ALTER TABLE users DROP COLUMN IF EXISTS new_column;
-- DELETE FROM role_permissions WHERE role = 'new_role';
`;

    fs.writeFileSync(rollbackPath, template);
    console.log(`📝 Rollback template created: ${rollbackFilename}`);
    console.log('Edit this file to add actual rollback SQL before running rollback.');
  }
}

// CLI interface
const rollback = new MigrationRollback();

async function main() {
  const command = process.argv[2];
  
  if (command === 'last' || !command) {
    await rollback.rollbackLastMigration();
  } else if (command === 'to') {
    const targetMigration = process.argv[3];
    if (!targetMigration) {
      console.error('❌ Please specify target migration');
      console.log('Usage: npm run migrate:rollback to 001_initial_schema.sql');
      process.exit(1);
    }
    await rollback.rollbackToMigration(targetMigration);
  } else {
    console.log('Usage:');
    console.log('  npm run migrate:rollback        # Rollback last migration');
    console.log('  npm run migrate:rollback last   # Rollback last migration');
    console.log('  npm run migrate:rollback to <migration>  # Rollback to specific migration');
  }
  
  process.exit(0);
}

main().catch(console.error);
