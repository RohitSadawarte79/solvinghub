-- SolvingHub PostgreSQL Schema
-- Complete database schema with lifecycle management, voting, and real-time support

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  photo_url TEXT,
  reputation INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- =====================================================
-- PROBLEMS TABLE (with Lifecycle Support)
-- =====================================================
CREATE TYPE problem_status AS ENUM ('open', 'active', 'has_solutions', 'solved', 'archived');

CREATE TABLE problems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  impacts TEXT[] DEFAULT '{}',
  challenges TEXT[] DEFAULT '{}',
  
  -- Lifecycle fields
  status problem_status DEFAULT 'open',
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  
  -- Metrics
  votes INTEGER DEFAULT 0,
  discussions INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  quality_score DECIMAL(3,2) DEFAULT 0.0,
  
  -- Relationships
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance and cursor-based pagination
CREATE INDEX idx_problems_status ON problems(status);
CREATE INDEX idx_problems_category ON problems(category);
CREATE INDEX idx_problems_user_id ON problems(user_id);
CREATE INDEX idx_problems_last_activity ON problems(last_activity_at DESC);
CREATE INDEX idx_problems_created_at ON problems(created_at DESC);

-- Composite indexes for sorting/filtering
CREATE INDEX idx_problems_votes_created ON problems(votes DESC, created_at DESC);
CREATE INDEX idx_problems_discussions_created ON problems(discussions DESC, created_at DESC);
CREATE INDEX idx_problems_status_votes ON problems(status, votes DESC);
CREATE INDEX idx_problems_category_votes ON problems(category, votes DESC);

-- Full-text search index
CREATE INDEX idx_problems_search ON problems USING GIN (to_tsvector('english', title || ' ' || description));

-- =====================================================
-- COMMENTS TABLE
-- =====================================================
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  votes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_problem_id ON comments(problem_id, created_at DESC);
CREATE INDEX idx_comments_user_id ON comments(user_id);

-- =====================================================
-- REPLIES TABLE
-- =====================================================
CREATE TABLE replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_replies_comment_id ON replies(comment_id, created_at ASC);
CREATE INDEX idx_replies_problem_id ON replies(problem_id);

-- =====================================================
-- VOTING TABLES
-- =====================================================
CREATE TABLE problem_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, problem_id)
);

CREATE INDEX idx_problem_votes_user_problem ON problem_votes(user_id, problem_id);
CREATE INDEX idx_problem_votes_problem ON problem_votes(problem_id);

CREATE TABLE comment_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, comment_id)
);

CREATE INDEX idx_comment_votes_user_comment ON comment_votes(user_id, comment_id);
CREATE INDEX idx_comment_votes_problem ON comment_votes(problem_id);

-- =====================================================
-- SOLUTIONS TABLE (Future)
-- =====================================================
CREATE TABLE solutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  votes INTEGER DEFAULT 0,
  is_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_solutions_problem_id ON solutions(problem_id, votes DESC);
CREATE INDEX idx_solutions_user_id ON solutions(user_id);
CREATE INDEX idx_solutions_accepted ON solutions(problem_id, is_accepted) WHERE is_accepted = true;

-- =====================================================
-- TRIGGERS FOR AUTO-UPDATE
-- =====================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problems_updated_at BEFORE UPDATE ON problems
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_solutions_updated_at BEFORE UPDATE ON solutions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update problem last_activity_at when comments/votes are added
CREATE OR REPLACE FUNCTION update_problem_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE problems 
  SET last_activity_at = NOW()
  WHERE id = NEW.problem_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_activity_on_comment AFTER INSERT ON comments
FOR EACH ROW EXECUTE FUNCTION update_problem_activity();

CREATE TRIGGER update_activity_on_vote AFTER INSERT ON problem_votes
FOR EACH ROW EXECUTE FUNCTION update_problem_activity();

-- Update problem discussions count
CREATE OR REPLACE FUNCTION update_problem_discussions_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE problems SET discussions = discussions + 1 WHERE id = NEW.problem_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE problems SET discussions = discussions - 1 WHERE id = OLD.problem_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_discussions_on_comment_insert AFTER INSERT ON comments
FOR EACH ROW EXECUTE FUNCTION update_problem_discussions_count();

CREATE TRIGGER update_discussions_on_comment_delete AFTER DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_problem_discussions_count();

-- Update problem votes count
CREATE OR REPLACE FUNCTION update_problem_votes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE problems SET votes = votes + 1 WHERE id = NEW.problem_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE problems SET votes = votes - 1 WHERE id = OLD.problem_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_votes_on_vote_insert AFTER INSERT ON problem_votes
FOR EACH ROW EXECUTE FUNCTION update_problem_votes_count();

CREATE TRIGGER update_votes_on_vote_delete AFTER DELETE ON problem_votes
FOR EACH ROW EXECUTE FUNCTION update_problem_votes_count();

-- Calculate quality score based on completeness
CREATE OR REPLACE FUNCTION calculate_quality_score()
RETURNS TRIGGER AS $$
DECLARE
  score DECIMAL(3,2) := 0.0;
BEGIN
  -- Base score from title length (max 0.2)
  score := score + LEAST(LENGTH(NEW.title) / 100.0, 0.2);
  
  -- Description length (max 0.3)
  score := score + LEAST(LENGTH(NEW.description) / 500.0, 0.3);
  
  -- Tags count (max 0.2)
  score := score + LEAST(array_length(NEW.tags, 1) / 5.0 * 0.2, 0.2);
  
  -- Impacts count (max 0.15)
  score := score + LEAST(array_length(NEW.impacts, 1) / 3.0 * 0.15, 0.15);
  
  -- Challenges count (max 0.15)
  score := score + LEAST(array_length(NEW.challenges, 1) / 3.0 * 0.15, 0.15);
  
  NEW.quality_score := LEAST(score, 1.0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_quality_before_insert BEFORE INSERT ON problems
FOR EACH ROW EXECUTE FUNCTION calculate_quality_score();

CREATE TRIGGER calculate_quality_before_update BEFORE UPDATE ON problems
FOR EACH ROW EXECUTE FUNCTION calculate_quality_score();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE solutions ENABLE ROW LEVEL SECURITY;

-- Users: Public read, users can update their own profile
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Problems: Public read, authenticated users can create
CREATE POLICY "Problems are viewable by everyone" ON problems
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create problems" ON problems
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own problems" ON problems
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own problems" ON problems
  FOR DELETE USING (auth.uid() = user_id);

-- Comments: Public read, authenticated users can create
CREATE POLICY "Comments are viewable by everyone" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- Replies: Similar to comments
CREATE POLICY "Replies are viewable by everyone" ON replies
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create replies" ON replies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own replies" ON replies
  FOR DELETE USING (auth.uid() = user_id);

-- Votes: Users can only see/manage their own votes
CREATE POLICY "Users can view all votes" ON problem_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own votes" ON problem_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes" ON problem_votes
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view all comment votes" ON comment_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own comment votes" ON comment_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comment votes" ON comment_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Solutions: Similar to problems
CREATE POLICY "Solutions are viewable by everyone" ON solutions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create solutions" ON solutions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own solutions" ON solutions
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get problems with cursor-based pagination
CREATE OR REPLACE FUNCTION get_problems_paginated(
  page_size INT DEFAULT 20,
  cursor_id UUID DEFAULT NULL,
  cursor_created_at TIMESTAMPTZ DEFAULT NULL,
  sort_by TEXT DEFAULT 'created_at',
  category_filter TEXT DEFAULT NULL,
  status_filter problem_status DEFAULT NULL,
  search_query TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  tags TEXT[],
  status problem_status,
  votes INT,
  discussions INT,
  quality_score DECIMAL,
  created_at TIMESTAMPTZ,
  has_more BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH filtered_problems AS (
    SELECT p.*
    FROM problems p
    WHERE 
      (category_filter IS NULL OR p.category = category_filter)
      AND (status_filter IS NULL OR p.status = status_filter)
      AND (search_query IS NULL OR 
           to_tsvector('english', p.title || ' ' || p.description) @@ plainto_tsquery('english', search_query))
      AND (cursor_id IS NULL OR 
           (sort_by = 'created_at' AND p.created_at < cursor_created_at) OR
           (sort_by = 'votes' AND (p.votes < (SELECT votes FROM problems WHERE id = cursor_id) OR 
                                   (p.votes = (SELECT votes FROM problems WHERE id = cursor_id) AND p.created_at < cursor_created_at))) OR
           (sort_by = 'discussions' AND (p.discussions < (SELECT discussions FROM problems WHERE id = cursor_id) OR 
                                        (p.discussions = (SELECT discussions FROM problems WHERE id = cursor_id) AND p.created_at < cursor_created_at))))
    ORDER BY 
      CASE WHEN sort_by = 'votes' THEN p.votes END DESC,
      CASE WHEN sort_by = 'discussions' THEN p.discussions END DESC,
      p.created_at DESC
    LIMIT page_size + 1
  )
  SELECT 
    fp.id,
    fp.title,
    fp.description,
    fp.category,
    fp.tags,
    fp.status,
    fp.votes,
    fp.discussions,
    fp.quality_score,
    fp.created_at,
    (SELECT COUNT(*) FROM filtered_problems) > page_size AS has_more
  FROM filtered_problems fp
  LIMIT page_size;
END;
$$ LANGUAGE plpgsql;
