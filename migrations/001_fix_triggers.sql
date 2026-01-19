-- ====================================================================
-- MILESTONE 1 - TASK 1.2: FIX DATABASE TRIGGERS
-- ====================================================================
-- This SQL script fixes the trigger functions that incorrectly return NULL
-- 
-- PROBLEM: Triggers return NULL which aborts INSERT/DELETE operations
-- IMPACT: Comments and votes fail silently
-- 
-- RUN THIS IN YOUR SUPABASE SQL EDITOR

-- ====================================================================
-- Fix 1: Discussion Count Trigger
-- ====================================================================

CREATE OR REPLACE FUNCTION update_problem_discussions_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE problems SET discussions = discussions + 1 WHERE id = NEW.problem_id;
    RETURN NEW;  -- ✅ Fixed: Was RETURN NULL
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE problems SET discussions = discussions - 1 WHERE id = OLD.problem_id;
    RETURN OLD;  -- ✅ Fixed: Was RETURN NULL
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- Fix 2: Vote Count Trigger
-- ====================================================================

CREATE OR REPLACE FUNCTION update_problem_votes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE problems SET votes = votes + 1 WHERE id = NEW.problem_id;
    RETURN NEW;  -- ✅ Fixed: Was RETURN NULL
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE problems SET votes = votes - 1 WHERE id = OLD.problem_id;
    RETURN OLD;  -- ✅ Fixed: Was RETURN NULL
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- VERIFICATION QUERIES
-- ====================================================================

-- After running the above, test with these queries:

-- 1. Create a test problem
-- INSERT INTO problems (title, description, category, user_id)
-- VALUES ('Test Problem', 'Test description with more than fifty characters to pass validation requirements', 'Technology', 'your-user-id-here');

-- 2. Try to add a comment
-- INSERT INTO comments (problem_id, user_id, text)
-- VALUES ('test-problem-id', 'your-user-id', 'Test comment');

-- 3. Try to add a vote
-- INSERT INTO problem_votes (user_id, problem_id)
-- VALUES ('your-user-id', 'test-problem-id');

-- 4. Check counts updated
-- SELECT id, discussions, votes FROM problems WHERE id = 'test-problem-id';
-- Should show: discussions=1, votes=1

-- ====================================================================
-- NOTES
-- ====================================================================
-- 
-- Why this fixes it:
-- - RETURN NULL in AFTER trigger aborts the operation
-- - RETURN NEW allows INSERT/UPDATE to proceed
-- - RETURN OLD allows DELETE to proceed
--
-- What to watch for:
-- - If you have existing comments/votes with desynchronized counts,
--   you might want to recalculate:
--
-- UPDATE problems p SET 
--   discussions = (SELECT COUNT(*) FROM comments WHERE problem_id = p.id),
--   votes = (SELECT COUNT(*) FROM problem_votes WHERE problem_id = p.id);
