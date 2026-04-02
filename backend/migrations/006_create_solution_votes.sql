-- +migrate Up
CREATE TABLE IF NOT EXISTS solution_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    solution_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, solution_id)
);

CREATE INDEX IF NOT EXISTS idx_solution_votes_user_id ON solution_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_solution_votes_solution_id ON solution_votes(solution_id);

-- Add votes_count column to solutions table if not exists
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS votes_count INTEGER DEFAULT 0;

-- +migrate Down
DROP TABLE IF EXISTS solution_votes;