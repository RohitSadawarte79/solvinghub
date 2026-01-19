-- ====================================================================
-- MILESTONE 2 - TASK 2.2: ADD DATABASE CONSTRAINTS
-- ====================================================================
-- This SQL script adds database-level constraints to prevent data corruption
-- 
-- PROBLEM: No constraints on array sizes or string lengths
-- IMPACT: DOS via huge arrays/strings, database bloat
-- 
-- RUN THIS IN YOUR SUPABASE SQL EDITOR AFTER 001_fix_triggers.sql

-- ====================================================================
-- Array Size Constraints
-- ====================================================================

-- Prevent unbounded array growth (max 5 items each)
ALTER TABLE problems 
  DROP CONSTRAINT IF EXISTS check_tags_count;

ALTER TABLE problems 
  ADD CONSTRAINT check_tags_count 
  CHECK (array_length(tags, 1) IS NULL OR array_length(tags, 1) <= 5);

ALTER TABLE problems 
  DROP CONSTRAINT IF EXISTS check_impacts_count;

ALTER TABLE problems 
  ADD CONSTRAINT check_impacts_count 
  CHECK (array_length(impacts, 1) IS NULL OR array_length(impacts, 1) <= 5);

ALTER TABLE problems 
  DROP CONSTRAINT IF EXISTS check_challenges_count;

ALTER TABLE problems 
  ADD CONSTRAINT check_challenges_count 
  CHECK (array_length(challenges, 1) IS NULL OR array_length(challenges, 1) <= 5);

-- ====================================================================
-- String Length Constraints
-- ====================================================================

-- Prevent DOS via huge strings
ALTER TABLE problems 
  DROP CONSTRAINT IF EXISTS check_title_length;

ALTER TABLE problems 
  ADD CONSTRAINT check_title_length 
  CHECK (length(title) >= 10 AND length(title) <= 200);

ALTER TABLE problems 
  DROP CONSTRAINT IF EXISTS check_description_length;

ALTER TABLE problems 
  ADD CONSTRAINT check_description_length 
  CHECK (length(description) >= 50 AND length(description) <= 5000);

ALTER TABLE comments 
  DROP CONSTRAINT IF EXISTS check_comment_length;

ALTER TABLE comments 
  ADD CONSTRAINT check_comment_length 
  CHECK (length(text) >= 1 AND length(text) <= 2000);

ALTER TABLE replies 
  DROP CONSTRAINT IF EXISTS check_reply_length;

ALTER TABLE replies 
  ADD CONSTRAINT check_reply_length 
  CHECK (length(text) >= 1 AND length(text) <= 1000);

-- ====================================================================
-- VERIFICATION QUERIES
-- ====================================================================

-- After running the above, test with these queries:

-- 1. Try to insert problem with 6 tags (should fail)
-- INSERT INTO problems (title, description, category, tags, user_id)
-- VALUES (
--   'Test Problem', 
--   'Test description with more than fifty characters here',
--   'Technology',
--   ARRAY['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6'],  -- 6 tags!
--   'your-user-id'
-- );
-- Expected: ERROR: new row violates check constraint "check_tags_count"

-- 2. Try to insert problem with 5-char title (should fail)
-- INSERT INTO problems (title, description, category, user_id)
-- VALUES ('Short', 'Valid description with enough characters', 'Technology', 'your-user-id');
-- Expected: ERROR: new row violates check constraint "check_title_length"

-- 3. Try to insert valid problem (should succeed)
-- INSERT INTO problems (title, description, category, tags, user_id)
-- VALUES (
--   'Valid Title',
--   'This is a valid description that meets all requirements',
--   'Technology',
--   ARRAY['tag1', 'tag2'],
--   'your-user-id'
-- );
-- Expected: Success

-- ====================================================================
-- CHECK EXISTING DATA FOR VIOLATIONS
-- ====================================================================

-- Before adding constraints, check if existing data would violate them:

-- Check for problems with >5 tags
SELECT id, title, array_length(tags, 1) as tag_count 
FROM problems 
WHERE array_length(tags, 1) > 5;

-- Check for problems with >5 impacts
SELECT id, title, array_length(impacts, 1) as impact_count 
FROM problems 
WHERE array_length(impacts, 1) > 5;

-- Check for problems with >5 challenges
SELECT id, title, array_length(challenges, 1) as challenge_count 
FROM problems 
WHERE array_length(challenges, 1) > 5;

-- Check for problems with title too short
SELECT id, title, length(title) as title_length 
FROM problems 
WHERE length(title) < 10;

-- Check for problems with title too long
SELECT id, title, length(title) as title_length 
FROM problems 
WHERE length(title) > 200;

-- Check for problems with description too short
SELECT id, title, length(description) as desc_length 
FROM problems 
WHERE length(description) < 50;

-- If any of these return rows, you need to clean the data first!

-- ====================================================================
-- NOTES
-- ====================================================================
-- 
-- Why this matters:
-- - Database constraints are the LAST LINE OF DEFENSE
-- - Even if API validation is bypassed, bad data can't enter database
-- - Prevents DOS attacks via huge arrays/strings
-- - Ensures data integrity
--
-- What to watch for:
-- - If you have existing bad data, constraints will fail to add
-- - Run the check queries first and clean data if needed
-- - Example cleanup:
--
-- UPDATE problems 
-- SET tags = tags[1:5]  -- Trim to 5 tags
-- WHERE array_length(tags, 1) > 5;
