-- 005_create_solutions.sql
-- Depends on: 002_create_problems.sql

-- Solutions table
CREATE TABLE IF NOT EXISTS solutions (
    id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id            UUID          NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    author_id             UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_name           TEXT          NOT NULL DEFAULT '',
    author_photo_url      TEXT          NOT NULL DEFAULT '',
    author_rank           TEXT          NOT NULL DEFAULT 'F',
    author_points         INT           NOT NULL DEFAULT 0,
    title                 TEXT          NOT NULL,
    description           TEXT          NOT NULL,
    attachments           JSONB         NOT NULL DEFAULT '[]',
    implementation_approach TEXT,
    resources_needed      TEXT,
    estimated_timeline    TEXT,
    status                TEXT          NOT NULL DEFAULT 'submitted',
    created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- User ranks table
CREATE TABLE IF NOT EXISTS user_ranks (
    user_id               UUID          PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_rank          TEXT          NOT NULL DEFAULT 'F',
    points                INT           NOT NULL DEFAULT 0,
    problems_solved       INT           NOT NULL DEFAULT 0,
    solutions_accepted    INT           NOT NULL DEFAULT 0,
    total_contributions   INT           NOT NULL DEFAULT 0,
    updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Add solution_count to problems table
ALTER TABLE problems ADD COLUMN IF NOT EXISTS solution_count INT NOT NULL DEFAULT 0;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS difficulty TEXT NOT NULL DEFAULT 'medium';
ALTER TABLE problems ADD COLUMN IF NOT EXISTS min_rank_required TEXT NOT NULL DEFAULT 'F';

-- Indexes for solutions
CREATE INDEX IF NOT EXISTS idx_solutions_problem_id ON solutions(problem_id);
CREATE INDEX IF NOT EXISTS idx_solutions_author_id ON solutions(author_id);
CREATE INDEX IF NOT EXISTS idx_solutions_status ON solutions(status);
CREATE INDEX IF NOT EXISTS idx_solutions_created_at ON solutions(created_at DESC);