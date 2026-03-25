# SolvingHub — Deep System Analysis

> **Author**: Auto-generated analysis  
> **Date**: 2026-03-25  
> **Codebase Version**: 0.1.0 (Next.js 15.3.2)

---

## 1. Purpose

**SolvingHub** is a community-driven web platform where users can discover, post, discuss, and vote on **real-world problems**. The core philosophy is **"Problem-First, Not Solution-First"** — the platform focuses on surfacing and understanding problems before jumping to solutions.

It targets students, innovators, and social entrepreneurs who want to collaborate on impactful issues across domains like education, health, environment, technology, and more.

### Creators
Rohit Sadawarte, Rohit Singh, Rajnish Malviya, Ritik Pawar

---

## 2. Scope

### In Scope
| Feature | Status |
|---|---|
| Google OAuth login | ✅ Implemented |
| Post a problem (title, description, category, tags, impacts, challenges) | ✅ Implemented |
| Browse/discover problems with search, filter, sort, pagination | ✅ Implemented |
| Problem detail view with full description | ✅ Implemented |
| Upvote/downvote problems (toggle) | ✅ Implemented |
| Comment on problems (threaded with replies) | ✅ Implemented |
| Delete own comments (with cascade to replies) | ✅ Implemented |
| Edit own problems | ✅ Implemented |
| Delete own problems | ✅ Implemented |
| "My Problems" dashboard | ✅ Implemented |
| Responsive design (mobile + desktop) | ✅ Implemented |
| Vercel Analytics | ✅ Integrated |

### Out of Scope (Not Yet Implemented)
- Proposed Solutions tab (placeholder: "Coming Soon")
- Email newsletter subscription (UI exists, backend not wired)
- User profile pages
- Admin panel / moderation tools
- Notification system
- Team collaboration features
- About / Contact / FAQ pages (footer buttons exist, no routes)

---

## 3. System Architecture Diagram

```mermaid
graph TB
    subgraph "Client (Browser)"
        A["Next.js App Router<br/>React 19 + App Directory"]
        B["shadcn/ui Components"]
        C["TailwindCSS 4"]
        D["Three.js / Globe (unused)"]
    end

    subgraph "Pages (src/app)"
        P1["/ → WelcomePage"]
        P2["/login → Google OAuth"]
        P3["/home → WelcomePage"]
        P4["/discover → DiscoverProblems"]
        P5["/post → PostProblem"]
        P6["/my-problems → MyProblems"]
        P7["/problems/[id] → ProblemDetail"]
        P8["/edit/[id] → EditProblem"]
    end

    subgraph "Firebase Services (BaaS)"
        F1["Firebase Auth<br/>(Google Provider)"]
        F2["Cloud Firestore"]
        F3["Firebase Analytics"]
    end

    subgraph "Firestore Collections"
        C1["problems"]
        C2["comments"]
        C3["replies"]
        C4["votes"]
        C5["commentVotes"]
    end

    A --> P1 & P2 & P3 & P4 & P5 & P6 & P7 & P8
    A --> B
    A --> C
    P2 --> F1
    P4 & P5 & P6 & P7 & P8 --> F2
    A --> F3
    F2 --> C1 & C2 & C3 & C4 & C5

    subgraph "Deployment"
        V["Vercel"]
        VA["Vercel Analytics"]
    end

    A --> V
    V --> VA
```

---

## 4. Data Model (Firestore Collections)

```mermaid
erDiagram
    PROBLEMS {
        string id PK
        string title
        string description
        string category
        string[] tags
        string[] impacts
        string[] challenges
        int votes
        int discussions
        string createdAt
        timestamp timestamp
        string submittedBy
        timestamp lastUpdated
        string updatedBy
    }
    
    COMMENTS {
        string id PK
        string problemId FK
        string text
        string authorId
        string authorName
        string authorPhotoURL
        int votes
        timestamp timestamp
    }
    
    REPLIES {
        string id PK
        string commentId FK
        string problemId FK
        string text
        string authorId
        string authorName
        string authorPhotoURL
        timestamp timestamp
    }
    
    VOTES {
        string id PK
        string userId FK
        string problemId FK
        timestamp timestamp
    }
    
    COMMENT_VOTES {
        string id PK
        string userId FK
        string problemId FK
        string commentId FK
    }

    PROBLEMS ||--o{ COMMENTS : "has"
    PROBLEMS ||--o{ VOTES : "receives"
    COMMENTS ||--o{ REPLIES : "has"
    COMMENTS ||--o{ COMMENT_VOTES : "receives"
```

---

## 5. Component Flow Diagram

```mermaid
flowchart LR
    subgraph Layout
        NAV["Navbar"]
        MAIN["Main Content"]
    end

    NAV --> |"Explore"| DISC["DiscoverProblems"]
    NAV --> |"Post"| POST["PostProblem"]
    NAV --> |"My Problems"| MY["MyProblems"]
    NAV --> |"Login"| LOGIN["LoginPage"]
    NAV --> |"Logo"| WELCOME["WelcomePage"]

    DISC --> |"Click card"| DETAIL["ProblemDetail"]
    MY --> |"Edit"| EDIT["EditProblem"]
    MY --> |"Click title"| DETAIL

    WELCOME --> |"Search"| DISC
    WELCOME --> |"Discover"| DISC
    WELCOME --> |"Submit"| BROKEN["/submit (404!)"]
    
    LOGIN --> |"Success"| HOME["/home"]
    LOGIN --> |"Already logged in"| DASHBOARD["/dashboard (404!)"]
```

---

## 6. Functional Requirements

### FR-1: Authentication
- Users must be able to sign in using Google OAuth
- Authenticated state must persist across page navigation
- Navbar must show user avatar when logged in, and login button when not
- Logout must clear the session

### FR-2: Problem Posting
- Authenticated users can submit problems with: title (≥10 chars), description (≥50 chars), category, tags (1-5), impacts (1-5), challenges (1-5)
- Form validation must run before submission
- Preview mode must show how the problem will look
- Unsaved changes dialog must warn before navigation

### FR-3: Problem Discovery
- All users (including unauthenticated) can browse problems
- Search by title and description (client-side filtering)
- Filter by category (multi-select)
- Sort by: Most Voted, Most Discussed, Newest, Alphabetical
- Pagination (6 items per page)
- Grid and List view toggle

### FR-4: Problem Detail
- Display full problem info: title, description, category, impacts, challenges, vote count, discussion count
- Voting (toggle upvote/remove for authenticated users)
- Discussion section with comments and nested replies
- Real-time comment updates via Firestore `onSnapshot`

### FR-5: Problem Management
- "My Problems" page shows problems submitted by the logged-in user
- Users can edit their own problems
- Users can delete their own problems
- Category-based filtering in My Problems

### FR-6: Commenting System
- Authenticated users can post comments on any problem
- Users can reply to comments (one level of nesting)
- Users can delete their own comments (cascading reply deletion via batch)
- Discussion count is tracked on the problem document

---

## 7. Non-Functional Requirements

### NFR-1: Performance
- Client-side rendering for all interactive pages (`"use client"`)
- Loading skeletons and spinners for async data
- Pagination to limit rendered items
- Firestore queries ordered/limited server-side

### NFR-2: Responsiveness
- Mobile-first responsive design
- Hamburger menu for mobile navigation
- Conditional view modes (list view forced on mobile)
- Sheet component for mobile category selector

### NFR-3: User Experience
- Toast notifications for success/error states
- Confirmation dialogs for destructive actions (delete, discard changes)
- Form validation with inline error messages
- Preview mode before submission

### NFR-4: Scalability (Current State)
- Firebase/Firestore handles scaling automatically
- No backend server to manage
- Vercel handles deployment and CDN

### NFR-5: Analytics
- Vercel Analytics integrated for page view tracking
- Firebase Analytics integrated (loaded dynamically on client)

---

## 8. Flaws, Bugs, and Security Leakages

### 🔴 CRITICAL — Security

#### 1. Hardcoded Firebase API Keys in Source Code
**File**: `src/lib/firebase.js` (lines 6-13)

```js
const firebaseConfig = {
  apiKey: "AIzaSyBU48KNiPzNBlztiEENN7zL8wzD3-3awQQ",
  authDomain: "solvinghub-eba06.firebaseapp.com",
  projectId: "solvinghub-eba06",
  ...
};
```

**Impact**: Firebase API keys are committed to Git. While Firebase API keys are _technically_ meant to be public (they identify the project, not grant access), this is still a bad practice because:
- The `apiKey` can be used to enumerate user accounts via the Auth API
- Combined with misconfigured Firestore rules, attackers can read/write any data
- The `measurementId` exposes analytics tracking

**Fix**: Move to environment variables (`.env.local`) and ensure proper Firestore security rules are in place.

---

#### 2. Authorization by `displayName` Instead of `uid`
**Files**: `src/app/edit/[id]/page.jsx` (line 148), `src/components/submitted problems/myProblems.jsx` (line 77)

```js
// Edit page: checks ownership by displayName
if (problemData.submittedBy !== auth.currentUser.displayName) {
  handleNotAuthorized();
}

// My Problems: queries by displayName
where("submittedBy", "==", currentUser.displayName || "Anonymous")
```

**Impact**: 
- `displayName` is **user-editable** and **not unique**
- Two users with the same display name can see each other's problems in "My Problems"
- A user who changes their display name loses access to their previously posted problems
- The `|| "Anonymous"` fallback means ALL anonymous users share the same identity

**Fix**: Store and query by `auth.currentUser.uid` instead of `displayName`. Store displayName separately for display purposes only.

---

#### 3. No Firestore Security Rules Validation
**Impact**: There is no evidence of Firestore security rules in the codebase. Without proper rules:
- Any authenticated user could modify/delete ANY problem (not just their own)
- Vote manipulation is possible (add unlimited votes)
- Comment impersonation is possible

**Fix**: Define Firestore security rules that validate:
- Only the author can update/delete their problems
- Users can only vote once per problem
- Users can only delete their own comments

---

#### 4. No Server-Side Authorization on Problem Deletion
**File**: `src/components/submitted problems/myProblems.jsx` (line 100-116)

```js
const handleDelete = async (id) => {
  await deleteDoc(doc(db, "problems", id));
};
```

**Impact**: Any user who knows a problem's Firestore document ID can delete it. Authorization is only client-side (UI hides the button), but the actual Firestore write has no validation.

---

### 🟠 HIGH — Bugs

#### 5. Login Redirect Inconsistency
**File**: `src/app/login/page.jsx`

```js
// Line 16: If already logged in, redirects to /dashboard (doesn't exist!)
router.push('/dashboard')

// Line 26: After login, redirects to /home 
router.push('/home')
```

**Impact**: Already authenticated users are redirected to `/dashboard` which is a 404 page.

---

#### 6. Broken "Submit a Problem" Link on Welcome Page
**File**: `src/components/navbar components/welcomePage.jsx` (line 251)

```jsx
<Link href="/submit">  // /submit doesn't exist! Should be /post
```

**Impact**: The CTA button on the landing page leads to a 404.

---

#### 7. Cancel/Back Buttons Navigate to Non-Existent `/problems`
**Files**: `PostProblem.jsx` (lines 273, 302), Cancel dialog navigates to `/problems` which doesn't exist (the correct route is `/discover`)

---

#### 8. Duplicate `calculateTimeAgo` Function
**Files**: `DiscoverProblems.jsx` (line 192), `problem-detail-component.jsx` (line 216)

The exact same 30-line function is copy-pasted in two files. This violates DRY principle and makes maintenance error-prone.

---

#### 9. `createdAt` Stored as Hardcoded String
**File**: `PostProblem.jsx` (line 217)

```js
createdAt: "Just now",  // Hardcoded string, never updated
timestamp: serverTimestamp(),
```

The `createdAt` field is a static string "Just now" that never changes, while `timestamp` is the actual server timestamp. My Problems page renders `problem.createdAt` which always shows "Just now".

---

#### 10. Comment Vote Handler is a No-Op
**File**: `problem-detail-component.jsx` (line 329-332)

```js
const handleVoteComment = async (commentId) => {
  console.log("Vote for comment:", commentId);
};
```

The function is defined but does nothing, and the `commentVotes` query infrastructure is built but never used in the UI to display comment vote buttons.

---

### 🟡 MEDIUM — Code Quality Issues

#### 11. Massive Component Files (God Components)
| File | Lines |
|---|---|
| `EditProblem` | 794 |
| `ProblemDetail` | 772 |
| `DiscoverProblems` | 730 |
| `PostProblem` | 670 |
| `WelcomePage` | 541 |

These files mix data fetching, state management, validation logic, and UI rendering in a single component. This makes them:
- Hard to test
- Hard to debug
- Hard to maintain

**Fix**: Extract into custom hooks (`useProblems`, `useVoting`, `useComments`), separate data layer, and smaller presentational components.

---

#### 12. Duplicated Code Between PostProblem and EditProblem
`PostProblem.jsx` and `EditProblem.jsx` share ~80% of the same code (form fields, validation, tag/impact/challenge handlers, preview UI). This is a maintenance nightmare.

**Fix**: Extract a shared `ProblemForm` component.

---

#### 13. Category Lists Duplicated in 4 Files
The categories array is hardcoded in:
- `welcomePage.jsx`
- `DiscoverProblems.jsx`
- `PostProblem.jsx`
- `EditProblem.jsx`

**Fix**: Create a shared `constants.js` file.

---

#### 14. No TypeScript
The project uses `.jsx` files with no type checking. For a project of this complexity, TypeScript would catch many bugs at compile time (the `components.json` even has `tsx: false`).

---

#### 15. `ClassValue` Imported but Unused in `utils.js`
```js
import { ClassValue, clsx } from "clsx";  // ClassValue is a TS type, unused in JS
```

---

#### 16. Spaces in Directory Names
```
components/navbar components/
components/problem details/
components/submitted problems/
```

Spaces in directory names cause issues with CLI tools, import paths, and are generally considered bad practice.

---

#### 17. Three.js Dependencies Installed but Unused
`@react-three/drei`, `@react-three/fiber`, `three`, `three-globe`, `@types/three` are in `package.json` and `globe.json` (417KB) exists in `data/`, but no Three.js components are actually rendered. There's only a comment placeholder in `login/page.jsx`.

**Impact**: ~2MB+ of unnecessary dependencies bloating the bundle.

---

#### 18. Duplicate Route: `/` and `/home` Render Same Component
Both the root page (`page.js`) and `/home/page.jsx` render `<WelcomePage />`, creating confusion about which is the canonical URL.

---

#### 19. Missing Error Boundaries
No React Error Boundaries are implemented. If any component throws, the entire app crashes with a white screen.

---

#### 20. No Test Files
Zero test files in the entire project (no `__tests__`, no `.test.js`, no `.spec.js`).

---

### 🟢 LOW — Improvements

#### 21. Missing SEO Metadata on Sub-Pages
Only the root `layout.js` has metadata. Individual pages like `/discover`, `/post`, `/my-problems` don't export metadata, so they all share the same title/description.

#### 22. No Loading/Error States for Dynamic Routes
Routes like `problems/[id]` and `edit/[id]` don't have `loading.js` or `error.js` files for Next.js streaming/error handling.

#### 23. No 404 Not Found Page
No custom `not-found.js` page — users see the default Next.js 404.

#### 24. No Dark Mode Toggle
The CSS supports dark mode with `.dark` class, but there's no UI toggle. The navbar is hardcoded to `bg-white`.

#### 25. `react-hook-form` + `FormProvider` Used But Not Actually Leveraged
Both `PostProblem` and `EditProblem` import and wrap with `FormProvider` from `react-hook-form`, but all form state is managed with raw `useState`. The form library adds bundle weight with zero benefit.

---

## 9. Security Leakage Summary

| # | Type | Severity | Description |
|---|---|---|---|
| 1 | Data Exposure | 🔴 Critical | Firebase config (API keys) hardcoded and committed to Git |
| 2 | Broken Access Control | 🔴 Critical | Authorization uses `displayName` (user-editable) instead of `uid` |
| 3 | Missing Authorization | 🔴 Critical | No Firestore security rules evidence — all writes potentially unguarded |
| 4 | IDOR | 🟠 High | Problem deletion has no server-side ownership check |
| 5 | Race Condition | 🟡 Medium | Vote count uses `increment()` but vote existence check + add is non-atomic |
| 6 | Information Disclosure | 🟡 Medium | `console.log` statements in production code (PostProblem line 224-226) |
| 7 | No Input Sanitization | 🟡 Medium | User-submitted HTML/text is rendered with `whitespace-pre-wrap` but no XSS protection beyond React's default escaping |
| 8 | No Rate Limiting | 🟢 Low | No rate limiting on problem posting, commenting, or voting |

---

## 10. Recommendations (Priority Order)

1. **Move Firebase config to `.env.local`** and set up proper Firestore security rules
2. **Replace `displayName` with `uid`** for all ownership checks and queries  
3. **Implement Firestore security rules** to enforce data access control server-side
4. **Fix broken routes**: `/dashboard` → `/home`, `/submit` → `/post`, `/problems` → `/discover`
5. **Extract shared code**: `ProblemForm`, `useAuth` hook, `constants.js`, `calculateTimeAgo` util
6. **Remove unused dependencies**: Three.js ecosystem, `react-hook-form` (or actually use it)
7. **Add TypeScript** for compile-time safety
8. **Add tests** — at minimum for auth flows, form validation, and data queries
9. **Add Error Boundaries** and custom 404/error pages
10. **Implement Firestore composite indexes** for complex queries (category + sort)

---

## 11. Tech Stack Summary

| Layer | Technology |
|---|---|
| Framework | Next.js 15.3.2 (App Router) |
| UI Library | React 19 |
| Component Library | shadcn/ui (New York style) |
| Styling | TailwindCSS 4.1.6 |
| Authentication | Firebase Auth (Google Provider) |
| Database | Cloud Firestore |
| Analytics | Vercel Analytics + Firebase Analytics |
| Forms | react-hook-form + Zod (installed but mostly unused) |
| Toasts | Sonner |
| Icons | Lucide React |
| Deployment | Vercel |
| 3D (unused) | Three.js + React Three Fiber + Drei |
