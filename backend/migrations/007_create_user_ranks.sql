-- 007_create_user_ranks.sql
-- User ranking system table for tracking user points and ranks

CREATE TABLE IF NOT EXISTS user_ranks (
    user_id             UUID        PRIMARY KEY,
    current_rank        TEXT        NOT NULL DEFAULT 'F' CHECK (current_rank IN ('F', 'E', 'D', 'C', 'B', 'A', 'S')),
    points              INTEGER     NOT NULL DEFAULT 0 CHECK (points >= 0),
    problems_solved     INTEGER     NOT NULL DEFAULT 0 CHECK (problems_solved >= 0),
    solutions_accepted  INTEGER     NOT NULL DEFAULT 0 CHECK (solutions_accepted >= 0),
    total_contributions INTEGER    NOT NULL DEFAULT 0 CHECK (total_contributions >= 0),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Foreign key constraint to users table
ALTER TABLE user_ranks 
ADD CONSTRAINT fk_user_ranks_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_ranks_points_desc ON user_ranks(points DESC);
CREATE INDEX IF NOT EXISTS idx_user_ranks_rank ON user_ranks(current_rank);
CREATE INDEX IF NOT EXISTS idx_user_ranks_updated_at ON user_ranks(updated_at DESC);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_ranks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_user_ranks_updated_at
    BEFORE UPDATE ON user_ranks
    FOR EACH ROW
    EXECUTE FUNCTION update_user_ranks_updated_at();
