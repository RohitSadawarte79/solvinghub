# 🌐 SolvingHub

**A community-driven platform for discovering, discussing, and solving real-world problems.**

[![Next.js](https://img.shields.io/badge/Next.js-16.1.3-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green?logo=supabase)](https://supabase.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.6-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://vercel.com/)

---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [What This Project Does](#-what-this-project-does)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture Overview](#-architecture-overview)
- [Folder Structure](#-folder-structure)
- [Authentication & Authorization](#-authentication--authorization)
- [Database Design](#-database-design)
- [API Routes Overview](#-api-routes-overview)
- [Data Flow](#-data-flow)
- [Setup Instructions](#-setup-instructions)
- [Environment Variables](#-environment-variables)
- [How to Run Locally](#-how-to-run-locally)
- [Security Model](#-security-model)
- [Future Improvements](#-future-improvements)
- [Contributing](#-contributing)
- [Credits](#-credits)

---

## ❓ Problem Statement

**Why does this project exist?**

Most innovation platforms focus on solutions first, missing the critical step of properly understanding and articulating problems. SolvingHub takes a **"Problem-First, Not Solution-First"** approach:

- Real-world problems often lack proper documentation and visibility
- Innovators struggle to find meaningful problems to solve
- Traditional platforms don't facilitate structured problem discussion
- There's no centralized place for communities to collaboratively analyze challenges

SolvingHub addresses these issues by providing a dedicated space where users can **discover, document, discuss, and vote on real-world problems** before jumping to solutions.

---

## 🎯 What This Project Does

SolvingHub is a full-stack web application that enables:

1. **Problem Discovery** - Browse categorized real-world problems with search and filtering
2. **Problem Submission** - Submit structured problems with title, description, impacts, and challenges
3. **Community Discussion** - Comment threads with nested replies for each problem
4. **Community Voting** - Upvote problems to surface the most impactful ones
5. **User Profiles** - Track your submitted problems and contributions
6. **Real-time Updates** - Live updates when new comments are added via Supabase Realtime

---

## ✨ Features

### Core Features
- 📝 **Problem Posting** - Rich form with validation for structured problem submission
- 🔍 **Problem Discovery** - Browse, search, filter by category, and sort problems
- 💬 **Discussions** - Comment on problems with nested reply support
- 👍 **Voting System** - Upvote problems to increase visibility
- 👤 **User Authentication** - Google OAuth via Supabase Auth
- 📱 **Responsive Design** - Mobile-first, works on all devices
- 🎨 **Dark Mode Ready** - Full dark theme support

### Technical Features
- ⚡ **Real-time Subscriptions** - Live comment updates via Supabase Realtime
- 🛡️ **XSS Protection** - Input sanitization on all user content
- ✅ **Form Validation** - Zod schema validation on API routes
- 🔐 **Row Level Security** - Database-enforced access control
- 📊 **Quality Scoring** - Automatic problem quality calculation
- 🔄 **Optimistic Updates** - Instant UI feedback on user actions

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework with App Router |
| **React 19** | UI library |
| **Tailwind CSS 4** | Utility-first styling |
| **Radix UI** | Accessible component primitives |
| **shadcn/ui** | Pre-built UI components |
| **Lucide React** | Icon library |
| **React Hook Form** | Form state management |
| **Zod** | Schema validation |
| **Sonner** | Toast notifications |

### Backend
| Technology | Purpose |
|------------|---------|
| **Supabase** | PostgreSQL database + Auth + Realtime |
| **Next.js API Routes** | Server-side API endpoints |
| **@supabase/ssr** | Server-side Supabase client |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| **Vercel** | Hosting and deployment |
| **PostgreSQL** | Primary database (via Supabase) |
| **Vercel Analytics** | Usage tracking |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│   │   React     │  │   Supabase  │  │     Next.js Pages       │ │
│   │ Components  │  │   Client    │  │   (App Router)          │ │
│   └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
└──────────┼────────────────┼─────────────────────┼───────────────┘
           │                │                     │
           ▼                ▼                     ▼
┌──────────────────────────────────────────────────────────────────┐
│                      MIDDLEWARE (Edge)                            │
│              Session Refresh & Cookie Management                  │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                    NEXT.JS API ROUTES                             │
│   ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│   │ /api/problems│  │ /api/comments│  │ /api/problems/[id] │    │
│   │   GET, POST  │  │    DELETE    │  │   /vote, /comments │    │
│   └──────┬───────┘  └──────┬───────┘  └─────────┬──────────┘    │
│          │                 │                    │               │
│          └─────────────────┴────────────────────┘               │
│                            │                                     │
│                     ┌──────▼──────┐                             │
│                     │ Auth Helper │                             │
│                     │ Validation  │                             │
│                     │ Sanitization│                             │
│                     └──────┬──────┘                             │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                        SUPABASE                                   │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────────┐       │
│   │  PostgreSQL │   │    Auth     │   │    Realtime     │       │
│   │   + RLS     │   │   (OAuth)   │   │  Subscriptions  │       │
│   └─────────────┘   └─────────────┘   └─────────────────┘       │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📁 Folder Structure

```
solvinghub/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── api/                      # API route handlers
│   │   │   ├── problems/             # Problems CRUD endpoints
│   │   │   │   ├── route.js          # GET (list), POST (create)
│   │   │   │   └── [id]/             # Single problem operations
│   │   │   │       ├── route.js      # GET, PATCH, DELETE
│   │   │   │       ├── vote/         # Problem voting
│   │   │   │       └── comments/     # Problem comments
│   │   │   └── comments/             # Comment operations
│   │   │       └── [id]/             # Single comment operations
│   │   │           ├── route.js      # DELETE
│   │   │           └── replies/      # Comment replies
│   │   ├── auth/
│   │   │   └── callback/             # OAuth callback handler
│   │   ├── discover/                 # Browse problems page
│   │   ├── problems/[id]/            # Problem detail page
│   │   ├── post/                     # Create new problem page
│   │   ├── my-problems/              # User's submitted problems
│   │   ├── login/                    # Authentication page
│   │   ├── edit/[id]/                # Edit problem page
│   │   ├── home/                     # Home page content
│   │   ├── layout.js                 # Root layout with providers
│   │   ├── page.js                   # Landing page
│   │   ├── globals.css               # Global styles
│   │   ├── error.jsx                 # Global error boundary
│   │   ├── loading.jsx               # Loading state
│   │   └── not-found.jsx             # 404 page
│   │
│   ├── components/                   # React components
│   │   ├── ui/                       # shadcn/ui components
│   │   │   ├── button.jsx
│   │   │   ├── card.jsx
│   │   │   ├── dropdown-menu.jsx
│   │   │   ├── tabs.jsx
│   │   │   ├── globe.jsx             # 3D globe component
│   │   │   └── ...                   # Other UI primitives
│   │   ├── navbar/                   # Navigation component
│   │   ├── navbar components/        # Welcome/landing page
│   │   ├── problems/                 # Problem listing components
│   │   ├── problem details/          # Problem detail view
│   │   ├── posting/                  # Problem creation form
│   │   └── submitted problems/       # User's problems list
│   │
│   ├── contexts/
│   │   └── AuthContext.js            # Authentication context provider
│   │
│   ├── lib/                          # Utility libraries
│   │   ├── supabase.js               # Client-side Supabase client
│   │   ├── supabase-server.js        # Server-side Supabase client
│   │   ├── auth-helper.js            # Authentication utilities
│   │   ├── api.js                    # Authenticated fetch wrapper
│   │   ├── validation.js             # Zod schemas
│   │   ├── sanitize.js               # XSS protection utilities
│   │   ├── errors.js                 # Error handling utilities
│   │   └── utils.js                  # General utilities
│   │
│   └── middleware.js                 # Session refresh middleware
│
├── public/                           # Static assets
├── migrations/                       # Database migrations
├── supabase/                         # Supabase configuration
├── supabase-schema.sql               # Complete database schema
├── supabase-state-machine.sql        # Problem lifecycle functions
├── SECURITY.md                       # Security documentation
├── SETUP_GUIDE.md                    # Detailed setup instructions
└── package.json                      # Dependencies
```

---

## 🔐 Authentication & Authorization

### Authentication Flow

SolvingHub uses **Supabase Auth with Google OAuth**:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  User clicks    │────▶│ Redirect to     │────▶│ Google OAuth    │
│  "Login"        │     │ Supabase Auth   │     │ consent screen  │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Session saved  │◀────│ Exchange code   │◀────│ Callback with   │
│  in cookies     │     │ for session     │     │ auth code       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        /auth/callback/route.js
```

### Key Components

1. **Client-side Auth (`src/lib/supabase.js`)**
   - Lazy-initialized Supabase client
   - `signInWithGoogle()` - Initiates OAuth flow
   - `signOut()` - Ends session
   - `getCurrentUser()` - Gets current user

2. **Server-side Auth (`src/lib/supabase-server.js`)**
   - `createClient()` - SSR-compatible client with cookie access
   - `createAdminClient()` - Service role client for admin operations

3. **Auth Helper (`src/lib/auth-helper.js`)**
   - `getAuthenticatedUser(request)` - Extracts user from cookies or Bearer token
   - Supports both browser sessions and API tokens

4. **Middleware (`src/middleware.js`)**
   - Runs on every request (except static files)
   - Refreshes expired sessions automatically
   - Ensures tokens are fresh for API calls

### Authorization Patterns

```javascript
// API Route pattern for protected endpoints
export async function POST(request) {
    const { user, error: authError, supabase } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // User is authenticated, proceed with operation
}
```

---

## 💾 Database Design

### Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     users       │     │    problems     │     │   solutions     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │◀────│ user_id (FK)    │     │ id (PK)         │
│ email           │     │ id (PK)         │◀────│ problem_id (FK) │
│ display_name    │     │ title           │     │ user_id (FK)    │
│ photo_url       │     │ description     │     │ title           │
│ reputation      │     │ category        │     │ description     │
│ created_at      │     │ tags[]          │     │ votes           │
│ updated_at      │     │ impacts[]       │     │ is_accepted     │
└─────────────────┘     │ challenges[]    │     │ created_at      │
                        │ status          │     └─────────────────┘
                        │ votes           │
                        │ discussions     │
                        │ view_count      │
                        │ quality_score   │
                        │ created_at      │
                        └────────┬────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   comments      │     │  problem_votes  │     │  comment_votes  │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ problem_id (FK) │     │ user_id (FK)    │     │ user_id (FK)    │
│ user_id (FK)    │     │ problem_id (FK) │     │ comment_id (FK) │
│ text            │     │ created_at      │     │ problem_id (FK) │
│ votes           │     │ UNIQUE(user,    │     │ created_at      │
│ created_at      │     │   problem)      │     └─────────────────┘
└───────┬─────────┘     └─────────────────┘
        │
        ▼
┌─────────────────┐
│    replies      │
├─────────────────┤
│ id (PK)         │
│ comment_id (FK) │
│ problem_id (FK) │
│ user_id (FK)    │
│ text            │
│ created_at      │
└─────────────────┘
```

### Tables Overview

| Table | Description |
|-------|-------------|
| `users` | User profiles (synced from Supabase Auth) |
| `problems` | Problem submissions with metadata |
| `comments` | Top-level comments on problems |
| `replies` | Nested replies to comments |
| `problem_votes` | Tracks which users voted on which problems |
| `comment_votes` | Tracks comment upvotes |
| `solutions` | Proposed solutions (future feature) |

### Problem Status Lifecycle

```
open → active → has_solutions → solved → archived
```

### Key Database Features

- **UUID Primary Keys** - All tables use UUIDs
- **Automatic Timestamps** - `created_at`, `updated_at` with triggers
- **Quality Score** - Auto-calculated based on content completeness
- **Discussion Count** - Auto-updated via triggers
- **Vote Count** - Maintained via triggers for performance
- **Full-text Search** - GIN index on problem title + description

---

## 🔌 API Routes Overview

### Problems API

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/problems` | List problems with pagination/filtering | No |
| `POST` | `/api/problems` | Create new problem | Yes |
| `GET` | `/api/problems/[id]` | Get single problem details | No |
| `PATCH` | `/api/problems/[id]` | Update problem (owner only) | Yes |
| `DELETE` | `/api/problems/[id]` | Delete problem (owner only) | Yes |
| `GET` | `/api/problems/[id]/vote` | Check if user voted | Yes |
| `POST` | `/api/problems/[id]/vote` | Toggle vote on problem | Yes |
| `GET` | `/api/problems/[id]/comments` | Get problem comments | No |
| `POST` | `/api/problems/[id]/comments` | Add comment | Yes |

### Comments API

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `DELETE` | `/api/comments/[id]` | Delete comment (owner only) | Yes |
| `POST` | `/api/comments/[id]/replies` | Add reply to comment | Yes |

### Query Parameters (GET /api/problems)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 10 | Results per page (max 100) |
| `offset` | number | 0 | Pagination offset |
| `sort_by` | string | `created_at` | Sort: `created_at`, `votes`, `views` |
| `category` | string | - | Filter by category |

---

## 🔄 Data Flow

### Creating a Problem

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ User fills  │────▶│ Client-side │────▶│ api.post()  │────▶│ POST /api/  │
│ form        │     │ validation  │     │ with token  │     │ problems    │
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
                                                                    │
                                                                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Redirect to │◀────│ Return      │◀────│ Insert to   │◀────│ Validate &  │
│ /my-problems│     │ problem     │     │ Supabase    │     │ Sanitize    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### Voting on a Problem

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ User clicks │────▶│ POST /api/  │────▶│ Check if    │
│ vote button │     │ problems/   │     │ already     │
└─────────────┘     │ [id]/vote   │     │ voted       │
                    └─────────────┘     └──────┬──────┘
                                               │
                          ┌────────────────────┴────────────────────┐
                          ▼                                         ▼
                   ┌─────────────┐                          ┌─────────────┐
                   │ If voted:   │                          │ If not:     │
                   │ Remove vote │                          │ Add vote    │
                   └──────┬──────┘                          └──────┬──────┘
                          │                                        │
                          ▼                                        ▼
                   ┌─────────────────────────────────────────────────────┐
                   │ Trigger updates problem.votes count automatically  │
                   └─────────────────────────────────────────────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │ Return new  │
                   │ vote state  │
                   └─────────────┘
```

---

## 🚀 Setup Instructions

### Prerequisites

- **Node.js** 18.17 or later
- **npm** or **yarn**
- **Supabase account** (free tier works)
- **Google Cloud Console** project (for OAuth)

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/solvinghub.git
cd solvinghub
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase-schema.sql`
3. Go to **Settings > API** and copy your keys

### Step 4: Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://your-domain.vercel.app/auth/callback` (production)
4. In Supabase, go to **Authentication > Providers > Google**
5. Enable Google and paste your Client ID and Secret

### Step 5: Configure Environment Variables

Create a `.env.local` file (see next section)

### Step 6: Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Supabase Service Role (Required for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional: Database URL for direct connections
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
```

> ⚠️ **NEVER commit `.env.local`** - it's already in `.gitignore`

### Environment Variable Descriptions

| Variable | Required | Prefix | Description |
|----------|----------|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | `NEXT_PUBLIC_` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | `NEXT_PUBLIC_` | Public anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | None | Admin key (server-only) |
| `DATABASE_URL` | No | None | Direct PostgreSQL connection |

---

## 💻 How to Run Locally

### Development Mode

```bash
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000) with hot reload.

### Production Build

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

---

## 🛡️ Security Model

### Row Level Security (RLS)

All tables have RLS enabled with the following policies:

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `users` | Public | - | Owner only | - |
| `problems` | Public | Authenticated | Owner only | Owner only |
| `comments` | Public | Authenticated | - | Owner only |
| `replies` | Public | Authenticated | - | Owner only |
| `problem_votes` | Public | Authenticated | - | Owner only |
| `comment_votes` | Public | Authenticated | - | Owner only |

### Security Layers

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Input Validation (Zod schemas)                 │
├─────────────────────────────────────────────────────────┤
│ Layer 2: Input Sanitization (XSS protection)            │
├─────────────────────────────────────────────────────────┤
│ Layer 3: Authentication (Supabase Auth + Middleware)    │
├─────────────────────────────────────────────────────────┤
│ Layer 4: Authorization (API route ownership checks)     │
├─────────────────────────────────────────────────────────┤
│ Layer 5: Row Level Security (Database-enforced)         │
└─────────────────────────────────────────────────────────┘
```

### XSS Protection

All user input is sanitized using `src/lib/sanitize.js`:

```javascript
import { sanitizeTitle, sanitizeProblemDescription } from '@/lib/sanitize';

// Before storing in database
const sanitizedTitle = sanitizeTitle(userInput);  // Strips all HTML
```

### Security Notes ⚠️

1. **Service Role Key** - Never expose in client code. Only used server-side.
2. **Rate Limiting** - Not yet implemented (TODO)
3. **CSRF Protection** - Relies on SameSite cookies
4. **Content Security Policy** - Consider adding CSP headers

See `SECURITY.md` for detailed security documentation.

---


## 🔮 Future Improvements

### Planned Features

- [ ] **Solutions System** - Submit and vote on solutions for problems
- [ ] **User Reputation** - Gamification based on contributions
- [ ] **Notifications** - Email/push for replies and votes
- [ ] **Problem Following** - Subscribe to problem updates
- [ ] **Teams/Organizations** - Collaborative problem-solving groups
- [ ] **Problem Templates** - Pre-structured problem formats
- [ ] **AI-Assisted Tagging** - Auto-suggest tags and categories
- [ ] **Rate Limiting** - Prevent spam and abuse
- [ ] **Admin Dashboard** - Moderation tools

### Technical Debt

- [ ] Add comprehensive test suite
- [ ] Implement error boundary UI
- [ ] Add API response caching
- [ ] Migrate to TypeScript
- [ ] Add Storybook for component documentation

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run linting: `npm run lint`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style

- Use ESLint configuration provided
- Follow existing component patterns
- Add comments for complex logic
- Use meaningful variable names

### Commit Messages

Follow conventional commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Adding tests

---

## 👥 Credits

**Created by:**
- Rohit Sadawarte

**Built with:**
- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Vercel](https://vercel.com/)

---

## 📄 License

This project is private and proprietary. All rights reserved.

---

<p align="center">
  <strong>🌐 SolvingHub - Where Problems Meet Solutions</strong>
</p>
