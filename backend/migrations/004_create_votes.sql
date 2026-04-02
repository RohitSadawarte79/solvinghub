-- 004_create_votes.sql
-- Depends on: 001_create_users.sql, 002_create_problems.sql, 003_create_comments_replies.sql

CREATE TABLE IF NOT EXISTS problem_votes (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id UUID        NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Prevents duplicate votes at the database level (fixes Firestore race condition)
    UNIQUE (user_id, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_problem_votes_user ON problem_votes(user_id, problem_id);

-- comment_votes is reserved for future feature implementation
CREATE TABLE IF NOT EXISTS comment_votes (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_id UUID        NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, comment_id)
);
