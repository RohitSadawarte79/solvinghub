# N+1 Query Diagnostics Guide

This guide explains how to use the newly enabled PostgreSQL diagnostics to identify and solve N+1 query patterns.

## 1. Analyzing Docker Logs (Real-time)

To see the queries as they hit the database, run:

```bash
docker logs -f solvinghub_db
```

### What to look for:
If you see a screen full of fast-repeating queries like this when fetching a list:
```sql
LOG:  statement: SELECT * FROM user_ranks WHERE user_id = '...' 
LOG:  statement: SELECT * FROM user_ranks WHERE user_id = '...' 
LOG:  statement: SELECT * FROM user_ranks WHERE user_id = '...' 
```
That is a **Classic N+1 Query**. It means the application is querying for each item's rank individually instead of using a `JOIN` or `IN (...)` query.

## 2. Using pg_stat_statements (Aggregated Stats)

This tool tracks every query ever run. To find the most frequent queries, run this SQL in **pgAdmin4** or `psql`:

```sql
-- Create the extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find TOP 5 most frequent queries
SELECT 
    query, 
    calls, 
    total_exec_time / calls as avg_time_ms,
    rows
FROM pg_stat_statements
ORDER BY calls DESC
LIMIT 5;
```

### How to interpret:
- **High `calls` count:** If a query has thousands of calls while its parent query has only a few, you've found an N+1.
- **High `avg_time_ms`:** These are slow individual queries that need indexing.

## 3. How to solve N+1 Queries
1. **Use JOINs:** Fetch related data in the initial query (e.g., `LEFT JOIN user_ranks`).
2. **Use IN queries:** Fetch all related IDs in a single batch query (e.g., `SELECT * FROM comments WHERE problem_id IN ($1, $2, ...)`).
