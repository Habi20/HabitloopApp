const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.rsxwbrnvahfmpsqdbfvt:ShelfWise@2002@aws-0-ap-south-1.pooler.supabase.com:6543/postgres'
});
pool.query('SELECT current_database(), current_schema();')
  .then(res => {
    console.log('Connected to database:', res.rows[0]);
    pool.end();
  })
  .catch(err => console.error('Connection error:', err));
