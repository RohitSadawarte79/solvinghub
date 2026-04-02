-- 002_create_problems.sql
-- Depends on: 001_create_users.sql

CREATE TABLE IF NOT EXISTS problems (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    title          TEXT        NOT NULL,
    description    TEXT        NOT NULL,
    category       TEXT        NOT NULL,
    tags           TEXT[]      NOT NULL DEFAULT '{}',
    impacts        TEXT[]      NOT NULL DEFAULT '{}',
    challenges     TEXT[]      NOT NULL DEFAULT '{}',
    votes_count    INT         NOT NULL DEFAULT 0,
    comments_count INT         NOT NULL DEFAULT 0,
    submitted_by_id UUID       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submitted_by   TEXT        NOT NULL DEFAULT '',  -- denormalized display name
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_problems_submitted_by_id ON problems(submitted_by_id);
CREATE INDEX IF NOT EXISTS idx_problems_category        ON problems(category);
CREATE INDEX IF NOT EXISTS idx_problems_votes_count     ON problems(votes_count DESC);
CREATE INDEX IF NOT EXISTS idx_problems_created_at      ON problems(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_problems_tags            ON problems USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_problems_search          ON problems USING GIN(to_tsvector('english', title || ' ' || description));
