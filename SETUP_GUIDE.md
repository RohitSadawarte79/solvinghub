# SolvingHub PostgreSQL Migration Setup Guide

## Quick Start

### 1. Install Dependencies

**Option A: Using PowerShell with Admin Rights**
```powershell
# Run PowerShell as Administrator, then:
Set-ExecutionPolicy RemoteSigned -Scope Process
npm install @supabase/supabase-js @supabase/ssr
npm uninstall firebase
```

**Option B: Using CMD**
```cmd
npm install @supabase/supabase-js @supabase/ssr
npm uninstall firebase
```

### 2. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new organization (if needed)
4. Create a new project:
   - Name: `solvinghub`
   - Database Password: (save this!)
   - Region: Choose closest to you
5. Wait 2-3 minutes for setup

### 3. Set Up Database Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy entire contents of `supabase-schema.sql`
4. Paste into SQL Editor
5. Click "Run" to execute

This will create:
- All tables (users, problems, comments, replies, votes, solutions)
- Indexes for fast cursor-based pagination
- Triggers for auto-updating fields
- Row Level Security policies
- Helper functions for pagination

### 4. Configure Google OAuth

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Enable **Google** provider
3. Add your Google OAuth credentials:
   - Get them from [Google Cloud Console](https://console.cloud.google.com)
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
4. Save configuration

### 5. Get API Keys

1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy these values:
   - Project URL
   - `anon` public key
   - `service_role` secret key (⚠️ Never expose this!)

### 6. Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   copy .env.local.example .env.local
   ```

2. Edit `.env.local` with your values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```

3. Add `.env.local` to `.gitignore` (should already be there)

### 7. Test Connection

Create a test file to verify setup:

```javascript
// test-supabase.js
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testConnection() {
  const { data, error } = await supabase.from('users').select('count')
  if (error) {
    console.error('❌ Connection failed:', error)
  } else {
    console.log('✅ Connected to Supabase!')
  }
}

testConnection()
```

Run: `node test-supabase.js`

---

## Migration Checklist

### Phase 1: Setup ✓
- [x] Create Supabase project
- [x] Run database schema
- [x] Configure Google OAuth
- [ ] Install npm dependencies
- [ ] Set environment variables
- [ ] Test connection

### Phase 2: Code Migration (Next Steps)
- [ ] Update login page
- [ ] Update navbar auth
- [ ] Create problem API routes
- [ ] Update DiscoverProblems component
- [ ] Update PostProblem component
- [ ] Update problem detail page

---

## Key Features Implemented

### 1. **Lifecycle State Machine**
Problems have status: `open` → `active` → `has_solutions` → `solved` → `archived`

### 2. **Cursor-Based Pagination**
- Uses `get_problems_paginated()` function
- No OFFSET (inefficient for large datasets)
- Returns `has_more` flag
- Supports sorting by votes, discussions, created_at

Example:
```javascript
const { data } = await supabase.rpc('get_problems_paginated', {
  page_size: 20,
  cursor_id: lastProblemId,
  cursor_created_at: lastCreatedAt,
  sort_by: 'votes',
  category_filter: 'Technology'
})
```

### 3. **Real-Time Subscriptions**
Sub-second latency for comments/votes:
```javascript
supabase
  .channel('problem-comments')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'comments' },
    (payload) => {
      // Update UI immediately
    }
  )
  .subscribe()
```

### 4. **Auto-Archive Cron Job**
(Will be implemented as Supabase Edge Function)

Detects stale problems:
- No activity for 90 days
- Auto-transitions to `archived` status
- Runs daily via cron

### 5. **Quality Scoring**
Automatic calculation based on:
- Title length (20%)
- Description detail (30%)
- Tags count (20%)
- Impacts specified (15%)
- Challenges specified (15%)

Score shown to users, used for ranking.

---

## Next Steps After Setup

1. **Update Login Page** - Switch to Supabase Auth
2. **Create API Routes** - Problems CRUD with pagination
3. **Update Components** - Replace Firestore calls
4. **Add Real-time** - Comment/vote subscriptions
5. **Deploy Edge Function** - Auto-archive cron job

---

## Troubleshooting

### PowerShell Script Execution Error
```
Set-ExecutionPolicy RemoteSigned -Scope Process
```
Or use CMD instead of PowerShell.

### Supabase Connection Fails
- Check `.env.local` values
- Verify Supabase project is active
- Check firewall/network

### RLS Policies Blocking Queries
- Verify user is authenticated
- Check policy rules in Supabase Dashboard

---

## Architecture Overview

```
Frontend (Next.js)
    ↓
Supabase Client (lib/supabase.js)
    ↓
Supabase Platform
    ├── PostgreSQL Database
    ├── Authentication (Google OAuth)
    ├── Realtime (WebSockets)
    └── Edge Functions (Cron jobs)
```

**Key Benefits:**
- ✅ Sub-second real-time updates
- ✅ Cursor pagination (scales to millions)
- ✅ Automatic quality scoring
- ✅ Built-in auth + security (RLS)
- ✅ Cron job support for auto-archive
