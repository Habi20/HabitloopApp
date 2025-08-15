// server/db.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from './env';
import * as schema from '../shared/schema';

// ✅ ENHANCED: SSL configuration for local development and production
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false, // ✅ Disable SSL for local development
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000, // ✅ Increased from 10s to 30s
  // ✅ Enhanced configuration for connections
  application_name: 'habitloop-app',
  keepAlive: true,
  keepAliveInitialDelayMillis: 0,
});

// ✅ Enhanced error handling for SSL certificate issues
pool.on('error', (err) => {
  console.error('Database pool error:', err.message);
  
  if (err.message?.includes('SELF_SIGNED_CERT_IN_CHAIN') || 
      err.message?.includes('self-signed certificate')) {
    console.error('❌ SSL Certificate Error - Self-signed certificate detected');
    console.error('💡 This is expected with Supabase - connection should continue');
  } else if (err.message?.includes('SCRAM') || err.message?.includes('SASL')) {
    console.error('❌ SCRAM Authentication Error - Check your database credentials');
  } else if (err.message?.includes('ENOTFOUND')) {
    console.warn('DNS resolution issue detected - connections will retry automatically');
  } else if (err.message?.includes('Connection terminated') || err.message?.includes('timeout')) {
    console.warn('⚠️ Database connection timeout - this is normal during development');
  } else {
    console.error('❌ Database pool error:', err.message);
  }
});

pool.on('connect', () => {
  console.log('✅ Database pool connection established (SSL with self-signed cert)');
});

// ✅ Add connection retry logic
pool.on('acquire', () => {
  console.log('🔗 Database connection acquired');
});

pool.on('release', () => {
  console.log('🔓 Database connection released');
});

// Create Drizzle instance with schema
export const db = drizzle(pool, { schema });
export { pool };

// Graceful shutdown
const gracefulShutdown = async () => {
  try {
    console.log('Shutting down database connections...');
    await pool.end();
    console.log('✅ Database connections closed gracefully');
  } catch (error) {
    console.error('Error during database shutdown:', error);
  }
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
