-- 003_create_comments_replies.sql
-- Depends on: 001_create_users.sql, 002_create_problems.sql

CREATE TABLE IF NOT EXISTS comments (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id      UUID        NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    author_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_name     TEXT        NOT NULL DEFAULT '',
    author_photo_url TEXT       NOT NULL DEFAULT '',
    body            TEXT        NOT NULL,
    votes_count     INT         NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS replies (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id      UUID        NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    problem_id      UUID        NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    author_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_name     TEXT        NOT NULL DEFAULT '',
    author_photo_url TEXT       NOT NULL DEFAULT '',
    body            TEXT        NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_problem_id ON comments(problem_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_replies_comment_id  ON replies(comment_id, created_at ASC);
