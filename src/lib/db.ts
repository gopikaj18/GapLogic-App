import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL;

if (!connectionString) {
  console.warn(
    '[db] DATABASE_URL is not set. API routes that need Postgres will fail until .env.local is configured.'
  );
}

export const pool = new Pool({
  connectionString,
  ssl:
    connectionString?.includes('railway') || connectionString?.includes('rlwy.net')
      ? { rejectUnauthorized: false }
      : undefined,
  max: 10,
});

let migrated = false;

export async function ensureMigrated(): Promise<void> {
  if (migrated) return;

  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS intentions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      category TEXT NOT NULL CHECK (category IN ('health', 'work', 'learning', 'personal')),
      effort_estimate INT NOT NULL,
      scheduled_time TEXT NOT NULL,
      estimated_duration INT NOT NULL,
      date TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_intentions_user_date ON intentions(user_id, date);

    CREATE TABLE IF NOT EXISTS reality_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      intention_id UUID NOT NULL REFERENCES intentions(id) ON DELETE CASCADE,
      completed BOOLEAN NOT NULL,
      actual_effort INT NOT NULL,
      friction_note TEXT NOT NULL DEFAULT '',
      context_note TEXT NOT NULL DEFAULT '',
      date TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_logs_user_date ON reality_logs(user_id, date);
  `);

  migrated = true;
}
