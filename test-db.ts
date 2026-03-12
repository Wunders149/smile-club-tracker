
import pg from 'pg';
const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
console.log('Testing connection with URL (masked password):', connectionString?.replace(/:.*@/, ':****@'));

const pool = new Pool({ 
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000
});

async function test() {
  try {
    const client = await pool.connect();
    console.log('Successfully connected!');
    const res = await client.query('SELECT NOW()');
    console.log('Current time from DB:', res.rows[0]);
    client.release();
  } catch (err) {
    console.error('Connection failed:', err.message);
    if (err.stack) console.error(err.stack);
  } finally {
    await pool.end();
  }
}

test();
