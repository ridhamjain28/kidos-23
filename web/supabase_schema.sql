-- ═══════════════════════════════════════════════════════════
-- KidOS — Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor to set up all tables.
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────────────────────────
-- TABLE: users
-- Stores the basic profile of each KidOS learner.
-- Parent consent (COPPA-style) is recorded here.
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  age           INT  NOT NULL CHECK (age BETWEEN 5 AND 13),
  nickname      TEXT NOT NULL,
  parent_email  TEXT,                        -- optional, for notifications
  parent_consent BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────────────────
-- TABLE: content_items
-- Every piece of AI-generated (or mock) content is stored here
-- so interactions can reference it by ID.
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_items (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic      TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  format     TEXT NOT NULL CHECK (format IN ('story', 'explanation', 'quiz')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────────────────
-- TABLE: interactions
-- Every click, like, skip, and time-on-card is recorded here.
-- This is the raw behavioural data that feeds the virtual
-- personality profile.
--
-- action values:
--   view           → child opened the card
--   like           → child pressed ❤️
--   skip           → child pressed ⏭️ (negative signal)
--   finish         → child reached the end of content
--   too_easy       → child said it was too easy (nudge difficulty up)
--   too_hard       → child said it was too hard (nudge difficulty down)
--   more_like_this → child pressed "give me more like this"
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS interactions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id       UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  action           TEXT NOT NULL CHECK (action IN (
                     'view','like','skip','finish','too_easy','too_hard','more_like_this'
                   )),
  duration_seconds INT NOT NULL DEFAULT 0,
  timestamp        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_interactions_user_id  ON interactions(user_id);
CREATE INDEX IF NOT EXISTS ix_interactions_timestamp ON interactions(timestamp DESC);

-- ──────────────────────────────────────────────────────────
-- TABLE: user_profiles
-- The "virtual personality" of each learner.
-- updated by the /api/update_profile route after every action.
--
-- topic_scores:       e.g. {"space": 2.5, "animals": 0.5}
--   Higher = more interested. Updated via the scoring rules in
--   lib/profileUtils.ts (like=+1, skip=-0.5, etc.)
--
-- format_preferences: e.g. {"story": 1.8, "quiz": 0.4}
--   Drives which content format is shown next.
--
-- avg_session_time:   Average seconds spent per card.
-- skip_rate:          Fraction of cards skipped (0–1).
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id            UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  topic_scores       JSONB NOT NULL DEFAULT '{}',
  format_preferences JSONB NOT NULL DEFAULT '{}',
  avg_session_time   NUMERIC NOT NULL DEFAULT 0,
  skip_rate          NUMERIC NOT NULL DEFAULT 0  CHECK (skip_rate BETWEEN 0 AND 1),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────────────────
-- ROW-LEVEL SECURITY (RLS)
-- Enable RLS so each user can only read/write their own data.
-- For the MVP the service-role key bypasses RLS server-side.
-- ──────────────────────────────────────────────────────────
ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles   ENABLE ROW LEVEL SECURITY;

-- Public read on content_items (they're not personal)
CREATE POLICY "content_items_public_read" ON content_items
  FOR SELECT USING (true);

-- Users can read/insert their own rows
CREATE POLICY "users_own_read"   ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_own_insert" ON users FOR INSERT WITH CHECK (true); -- open for signup

CREATE POLICY "interactions_own" ON interactions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "profiles_own"     ON user_profiles
  FOR ALL USING (user_id = auth.uid());
