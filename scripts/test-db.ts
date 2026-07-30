import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

async function main() {
  try {
    const { pool } = await import('../src/lib/db');
    const users = await pool.query('SELECT count(*) FROM users');
    const intentions = await pool.query('SELECT count(*) FROM intentions');
    const logs = await pool.query('SELECT count(*) FROM reality_logs');
    console.log('Users count:', users.rows[0].count);
    console.log('Intentions count:', intentions.rows[0].count);
    console.log('Reality logs count:', logs.rows[0].count);
    await pool.end();
  } catch (err) {
    console.error('Database query failed:', err);
  }
}

main().catch(console.error);
