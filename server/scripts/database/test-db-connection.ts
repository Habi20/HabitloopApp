// server/test-db-connection.ts
import { db } from '../../db';
import { sql } from 'drizzle-orm';
import { env } from '../../env'; // ← Add centralized env import

async function testConnection() {
  console.log('Testing database connection to:', env.DATABASE_URL.split('@')[1]); // ← Use env.DATABASE_URL
  
  try {
    // Test basic connection
    const testQuery = await db.execute(sql`SELECT version()`);
    console.log('✅ Basic connection successful. PostgreSQL version:', testQuery.rows[0].version);
    
    // Test schema access
    const tablesQuery = await db.execute(
      sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    );
    console.log('✅ Schema access successful. Tables found:', tablesQuery.rows.map(r => r.table_name));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:');
    
    // Fixed: Type guard to safely access error properties
    if (error instanceof Error) {
      console.error(error.message);
      
      // Safe casting to access code property
      const errorWithCode = error as any;
      
      if (errorWithCode.code === 'ECONNREFUSED') {
        console.error('\nPossible solutions:');
        console.error('1. Check if the database server is running');
        console.error('2. Verify DATABASE_URL in .env is correct');
        console.error('3. Check your network connection to the database host');
      } else if (errorWithCode.code === '28P01') {
        console.error('\nAuthentication failed. Please verify:');
        console.error('1. Database username/password in DATABASE_URL');
        console.error('2. If the user has proper permissions');
      }
    } else {
      console.error(error);
    }
    
    process.exit(1);
  }
}

testConnection();
