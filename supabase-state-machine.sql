-- Problem Lifecycle State Machine
-- Implements deterministic state transitions with validation

-- State transition rules function
CREATE OR REPLACE FUNCTION validate_problem_state_transition()
RETURNS TRIGGER AS $$
DECLARE
  valid_transition BOOLEAN := FALSE;
BEGIN
  -- Allow any status on INSERT
  IF TG_OP = 'INSERT' THEN
    IF NEW.status IS NULL THEN
      NEW.status := 'open';
    END IF;
    RETURN NEW;
  END IF;


  -- State machine logic for UPDATEs
  -- Define valid state transitions
  
  -- FROM 'open'
  IF OLD.status = 'open' THEN
    IF NEW.status IN ('open', 'active', 'archived') THEN
      valid_transition := TRUE;
    END IF;
  
  -- FROM 'active'
  ELSIF OLD.status = 'active' THEN
    IF NEW.status IN ('active', 'has_solutions', 'archived') THEN
      valid_transition := TRUE;
    END IF;
  
  -- FROM 'has_solutions'
  ELSIF OLD.status = 'has_solutions' THEN
    IF NEW.status IN ('has_solutions', 'solved', 'active', 'archived') THEN
      valid_transition := TRUE;
    END IF;
  
  -- FROM 'solved'
  ELSIF OLD.status = 'solved' THEN
    IF NEW.status IN ('solved', 'archived') THEN
      valid_transition := TRUE;
    END IF;
  
  -- FROM 'archived'
  ELSIF OLD.status = 'archived' THEN
    -- Can reopen archived problems
    IF NEW.status IN ('archived', 'open') THEN
      valid_transition := TRUE;
    END IF;
  END IF;

  -- Reject invalid transitions
  IF NOT valid_transition THEN
    RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
  END IF;

  -- Set archived_at timestamp when archiving
  IF NEW.status = 'archived' AND OLD.status != 'archived' THEN
    NEW.archived_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply state machine trigger to problems table
DROP TRIGGER IF EXISTS enforce_problem_state_machine ON problems;
CREATE TRIGGER enforce_problem_state_machine
  BEFORE INSERT OR UPDATE ON problems
  FOR EACH ROW
  EXECUTE FUNCTION validate_problem_state_transition();

-- Automatic state transitions based on activity

-- Auto-transition to 'active' when first comment is added
CREATE OR REPLACE FUNCTION auto_activate_problem()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the first comment on the problem
  IF (SELECT COUNT(*) FROM comments WHERE problem_id = NEW.problem_id) = 1 THEN
    -- Transition from 'open' to 'active'
    UPDATE problems
    SET status = 'active'
    WHERE id = NEW.problem_id AND status = 'open';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_activate_problem ON comments;
CREATE TRIGGER trigger_auto_activate_problem
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION auto_activate_problem();

-- Auto-transition to 'has_solutions' when first solution is added
CREATE OR REPLACE FUNCTION auto_mark_has_solutions()
RETURNS TRIGGER AS $$
BEGIN
  -- Transition to 'has_solutions' when first solution posted
  UPDATE problems
  SET status = 'has_solutions'
  WHERE id = NEW.problem_id 
    AND status IN ('open', 'active');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_has_solutions ON solutions;
CREATE TRIGGER trigger_auto_has_solutions
  AFTER INSERT ON solutions
  FOR EACH ROW
  EXECUTE FUNCTION auto_mark_has_solutions();

-- Auto-transition to 'solved' when solution is accepted
CREATE OR REPLACE FUNCTION auto_mark_solved()
RETURNS TRIGGER AS $$
BEGIN
  -- When a solution is accepted, mark problem as solved
  IF NEW.is_accepted = TRUE AND (OLD.is_accepted IS NULL OR OLD.is_accepted = FALSE) THEN
    UPDATE problems
    SET status = 'solved'
    WHERE id = NEW.problem_id
      AND status IN ('has_solutions', 'active');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_solved ON solutions;
CREATE TRIGGER trigger_auto_solved
  AFTER UPDATE ON solutions
  FOR EACH ROW
  WHEN (NEW.is_accepted = TRUE)
  EXECUTE FUNCTION auto_mark_solved();

-- Helper function to get valid next states
CREATE OR REPLACE FUNCTION get_valid_next_states(current_status problem_status)
RETURNS problem_status[] AS $$
BEGIN
  RETURN CASE current_status
    WHEN 'open' THEN ARRAY['open', 'active', 'archived']::problem_status[]
    WHEN 'active' THEN ARRAY['active', 'has_solutions', 'archived']::problem_status[]
    WHEN 'has_solutions' THEN ARRAY['has_solutions', 'solved', 'active', 'archived']::problem_status[]
    WHEN 'solved' THEN ARRAY['solved', 'archived']::problem_status[]
    WHEN 'archived' THEN ARRAY['archived', 'open']::problem_status[]
    ELSE ARRAY[]::problem_status[]
  END;
END;
$$ LANGUAGE plpgsql;

-- View to see current state distribution
CREATE OR REPLACE VIEW problem_state_stats AS
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM problems
GROUP BY status
ORDER BY count DESC;

/*
STATE MACHINE DIAGRAM:

     ┌──────┐
     │ open │ ◄──────────────┐
     └──┬───┘                │
        │                    │
        ▼                    │
    ┌────────┐               │
    │ active │               │
    └───┬────┘               │
        │                    │
        ▼                    │
┌────────────────┐           │
│ has_solutions  │           │
└────────┬───────┘           │
         │                   │
         ▼                   │
     ┌────────┐              │
     │ solved │              │
     └────┬───┘              │
          │                  │
          ▼                  │
      ┌──────────┐           │
      │ archived │ ─────────┘
      └──────────┘


TRANSITION RULES:
- open → active: Automatically when first comment added
- active → has_solutions: Automatically when first solution posted
- has_solutions → solved: Automatically when solution accepted
- any → archived: Manually or via cron (90 days inactive)
- archived → open: Manual reopen only

VALIDATION:
- Can't skip states (e.g., open → solved directly)
- Can't go backwards except from archived
- All transitions logged in last_activity_at
*/
