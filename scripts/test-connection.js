
import { pool } from "../server/db.js";

async function testConnection() {
  try {
    console.log("Testing database connection...");
    console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "Not set");
    
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    
    console.log("✅ Database connection successful!");
    console.log("Current time:", result.rows[0].current_time);
    console.log("Database version:", result.rows[0].db_version.split(' ')[0]);
    
    client.release();
    await pool.end();
    
    console.log("✅ Connection test completed successfully!");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.error("Full error:", error);
  }
}

testConnection();
