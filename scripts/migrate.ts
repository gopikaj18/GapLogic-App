import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

async function main() {
  const { ensureMigrated, pool } = await import('../src/lib/db');
  await ensureMigrated();
  console.log('Database tables are ready.');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
