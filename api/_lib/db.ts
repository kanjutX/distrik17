import pg from 'pg'

const { Pool } = pg

// Vercel Storage (Neon / Supabase / Prisma Postgres) injects different names
// depending on the provider, so accept any of them. Pooled URL first.
const connectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL_UNPOOLED

if (!connectionString) {
  // Fails loudly instead of letting every endpoint 500 with a cryptic
  // "connection refused" once someone forgets to link the database.
  console.warn('[db] No POSTGRES_URL / DATABASE_URL set — link a Postgres database in Vercel → Storage.')
}

// Single pooled connection reused across invocations on the same
// lambda instance; Vercel Postgres / Neon / Supabase all terminate
// TLS with a cert that node's default store won't always validate.
const pool = new Pool({
  connectionString,
  max: 3, // serverless: keep per-instance connections low so the DB doesn't run out of slots
  ssl: connectionString?.includes('localhost') ? false : { rejectUnauthorized: false },
})

/** Mirrors the @vercel/postgres `sql` tagged-template API on top of `pg`. */
export async function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  let text = ''
  strings.forEach((chunk, i) => {
    text += chunk
    if (i < values.length) text += `$${i + 1}`
  })
  const result = await pool.query(text, values as any[])
  return { rows: result.rows as any[] }
}

/**
 * Lazily makes sure the schema exists. Serverless functions are
 * stateless/cold-started, so this runs once per cold start rather than
 * relying on someone having pasted schema.sql into the dashboard first.
 * Safe to call on every request — every statement is IF NOT EXISTS.
 */
let ensuring: Promise<void> | null = null
export function ensureSchema(): Promise<void> {
  // Share one in-flight promise so concurrent cold-start requests don't run
  // CREATE TABLE at the same time (that can fail with a catalog race); reset
  // on failure so the next request retries instead of being stuck.
  if (!ensuring) {
    ensuring = runEnsureSchema().catch((err) => {
      ensuring = null
      throw err
    })
  }
  return ensuring
}

async function runEnsureSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      username VARCHAR(64) NOT NULL UNIQUE,
      email VARCHAR(128) NOT NULL UNIQUE,
      password_hash VARCHAR(256) NOT NULL,
      role VARCHAR(16) DEFAULT 'member',
      gang_title VARCHAR(128) DEFAULT 'Siswa Berandal Baru',
      avatar_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `
  await sql`
    CREATE TABLE IF NOT EXISTS reviews (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
      username VARCHAR(64) NOT NULL,
      gang_title VARCHAR(128),
      avatar_url TEXT,
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      category VARCHAR(64) NOT NULL,
      content TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `
  await sql`
    CREATE TABLE IF NOT EXISTS changelogs (
      id VARCHAR(64) PRIMARY KEY,
      version VARCHAR(32) NOT NULL,
      title VARCHAR(256) NOT NULL,
      author VARCHAR(64) NOT NULL,
      tag VARCHAR(32) NOT NULL,
      summary TEXT NOT NULL,
      changes JSONB DEFAULT '[]'::jsonb,
      banner_url TEXT,
      pinned BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `
  await sql`
    CREATE TABLE IF NOT EXISTS milestones (
      id VARCHAR(64) PRIMARY KEY,
      title VARCHAR(256) NOT NULL,
      description TEXT,
      progress INTEGER CHECK (progress >= 0 AND progress <= 100),
      status VARCHAR(32) DEFAULT 'dalam_pengerjaan',
      target_date VARCHAR(64),
      category VARCHAR(64) NOT NULL
    );
  `
  await sql`
    CREATE TABLE IF NOT EXISTS supporters (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(128) NOT NULL,
      tier_name VARCHAR(128) NOT NULL,
      amount BIGINT NOT NULL,
      message TEXT,
      roblox_user VARCHAR(64),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `
  // New: tracks which user liked which review, so the like button can't
  // be spammed by refreshing — this is the missing piece behind the
  // like feature (the "likes" column existed in the old schema, but
  // nothing ever wrote to it).
  await sql`
    CREATE TABLE IF NOT EXISTS review_likes (
      review_id VARCHAR(64) REFERENCES reviews(id) ON DELETE CASCADE,
      user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (review_id, user_id)
    );
  `

  // Key/value store the owner uses to configure the site at runtime —
  // release phase + date, donate link, etc — without redeploying.
  await sql`
    CREATE TABLE IF NOT EXISTS site_settings (
      key VARCHAR(64) PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `

  // Owner-managed announcements banner (separate from devlog/changelog —
  // short-lived notices: maintenance, events, server status).
  await sql`
    CREATE TABLE IF NOT EXISTS announcements (
      id VARCHAR(64) PRIMARY KEY,
      title VARCHAR(256) NOT NULL,
      body TEXT NOT NULL,
      level VARCHAR(16) DEFAULT 'info',
      pinned BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `

  // Logged-in gacha pulls from the "Identitas & Arsip" minigame — purely
  // cosmetic flavor items, persisted so a logged-in user's roll history
  // survives a refresh instead of living only in local state.
  await sql`
    CREATE TABLE IF NOT EXISTS gacha_pulls (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
      item_key VARCHAR(64) NOT NULL,
      item_name VARCHAR(128) NOT NULL,
      rarity VARCHAR(16) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `

  // Profile, Roblox-link, and placeholder combat-stat columns bolted onto
  // the original users table. ADD COLUMN IF NOT EXISTS so this is safe to
  // run against a database that already has rows from the old schema.
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS kills INTEGER DEFAULT 0;`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS deaths INTEGER DEFAULT 0;`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS roblox_id VARCHAR(32);`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS roblox_username VARCHAR(64);`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS roblox_verified BOOLEAN DEFAULT FALSE;`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS roblox_verify_code VARCHAR(16);`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS roblox_verify_expires_at TIMESTAMP WITH TIME ZONE;`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_gacha_roll_at TIMESTAMP WITH TIME ZONE;`
}

export async function getSetting(key: string): Promise<string | null> {
  const { rows } = await sql`SELECT value FROM site_settings WHERE key = ${key}`
  return rows[0]?.value ?? null
}

export async function getSettings(keys: string[]): Promise<Record<string, string | null>> {
  const { rows } = await sql`SELECT key, value FROM site_settings WHERE key = ANY(${keys})`
  const map: Record<string, string | null> = {}
  for (const k of keys) map[k] = null
  for (const r of rows) map[r.key] = r.value
  return map
}

export async function setSetting(key: string, value: string | null) {
  await sql`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES (${key}, ${value}, CURRENT_TIMESTAMP)
    ON CONFLICT (key) DO UPDATE SET value = ${value}, updated_at = CURRENT_TIMESTAMP
  `
}

export function genId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}
