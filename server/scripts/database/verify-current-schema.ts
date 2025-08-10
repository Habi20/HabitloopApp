import { db } from '../../db';
import { sql } from 'drizzle-orm';

async function verifyCurrentSchema() {
  try {
    // Check users table structure
    const usersColumns = await db.execute(sql`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log('📊 Current Users table columns:');
    usersColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (default: ${col.column_default || 'none'})`);
    });
    
    // Check role_permissions table
    const rolePermCount = await db.execute(sql`SELECT COUNT(*) as count FROM role_permissions;`);
    console.log(`📊 Role permissions count: ${rolePermCount.rows[0].count}`);
    
    // Check if tables exist
    const tables = await db.execute(sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    console.log('📊 All public tables:', tables.rows.map(t => t.table_name));
    
  } catch (error) {
    console.error('❌ Schema verification failed:', error);
  }
  process.exit(0);
}

verifyCurrentSchema();
