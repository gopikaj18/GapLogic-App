import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

async function main() {
  const { pool, ensureMigrated } = await import('../src/lib/db');
  const { hashPassword } = await import('../src/lib/auth-server');

  console.log('Testing DB and Auth helpers...');
  try {
    await ensureMigrated();
    console.log('Database migrated successfully.');

    const email = `debug-${Date.now()}@example.com`;
    const passwordHash = await hashPassword('password123');
    console.log('Password hash completed:', passwordHash);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, created_at`,
      [email, passwordHash, 'Debug User']
    );
    console.log('Insert user query successful:', result.rows[0]);
    await pool.end();
  } catch (error) {
    console.error('Registration flow failed:', error);
  }
}

main().catch(console.error);
