-- ==========================================
-- SCHEMA DATABASE VERCEL POSTGRES / NEON / SUPABASE
-- Project: DISTRIK 17 (Roblox Delinquent SMA Hub)
-- ==========================================

-- 1. Tabel Users
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE,
  email VARCHAR(128) NOT NULL UNIQUE,
  password_hash VARCHAR(256) NOT NULL,
  role VARCHAR(16) DEFAULT 'member', -- 'member' | 'owner'
  gang_title VARCHAR(128) DEFAULT 'Siswa Berandal Baru',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Reviews & Feedback
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

-- 3. Tabel Changelogs / Devlogs (Owner Post)
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

-- 4. Tabel Milestones / Status Fitur
CREATE TABLE IF NOT EXISTS milestones (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(256) NOT NULL,
  description TEXT,
  progress INTEGER CHECK (progress >= 0 AND progress <= 100),
  status VARCHAR(32) DEFAULT 'dalam_pengerjaan',
  target_date VARCHAR(64),
  category VARCHAR(64) NOT NULL
);

-- 5. Tabel Supporters / Donasi Kas
CREATE TABLE IF NOT EXISTS supporters (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  tier_name VARCHAR(128) NOT NULL,
  amount BIGINT NOT NULL,
  message TEXT,
  roblox_user VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabel Review Likes (baru)
-- Mencatat siapa sudah like review mana, supaya tombol like di-rate-limit
-- per user alih-alih bisa di-spam dengan refresh halaman.
CREATE TABLE IF NOT EXISTS review_likes (
  review_id VARCHAR(64) REFERENCES reviews(id) ON DELETE CASCADE,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (review_id, user_id)
);

-- 7. Site settings (key/value, diset owner lewat Panel Admin di web)
CREATE TABLE IF NOT EXISTS site_settings (
  key VARCHAR(64) PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- key yang dipakai: release_phase, release_date (ISO, NULL = belum diumumkan), donate_link

-- 8. Pengumuman (owner CRUD, terpisah dari devlog)
CREATE TABLE IF NOT EXISTS announcements (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(256) NOT NULL,
  body TEXT NOT NULL,
  level VARCHAR(16) DEFAULT 'info', -- 'info' | 'warning' | 'event'
  pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Riwayat gacha minigame (Identitas & Arsip) — kosmetik doang
CREATE TABLE IF NOT EXISTS gacha_pulls (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  item_key VARCHAR(64) NOT NULL,
  item_name VARCHAR(128) NOT NULL,
  rarity VARCHAR(16) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Kolom tambahan di users: profil, link Roblox, placeholder stats
ALTER TABLE users ADD COLUMN IF NOT EXISTS kills INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deaths INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS roblox_id VARCHAR(32);
ALTER TABLE users ADD COLUMN IF NOT EXISTS roblox_username VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS roblox_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS roblox_verify_code VARCHAR(16);
ALTER TABLE users ADD COLUMN IF NOT EXISTS roblox_verify_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_gacha_roll_at TIMESTAMP WITH TIME ZONE;

-- Catatan: tabel-tabel di atas juga otomatis dibuat/dimigrasi sendiri oleh
-- api/_lib/db.ts (ensureSchema) saat endpoint pertama kali dipanggil,
-- jadi menjalankan file ini manual di tab Query itu opsional, bukan wajib.

-- Promosikan akun pertama jadi owner setelah register lewat situs:
-- UPDATE users SET role = 'owner' WHERE email = 'email-kamu@contoh.com';
