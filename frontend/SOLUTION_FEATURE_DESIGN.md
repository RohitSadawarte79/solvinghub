# SolvingHub - Solution Feature System Design

**Version:** 1.0  
**Date:** 2026-03-25  
**Status:** System Design Specification

---

## 1. Overview

This document outlines the full system design for the Solution Posting feature on SolvingHub. The system enables innovators to submit structured solutions to problems while maintaining privacy and implementing a rank-based access system.

---

## 2. Core Architecture

```
User Flow:
[Problem Posted] 
    --> [Collaborate & Talk] (Public brainstorming, visible to all)
    --> [Submit Solution] (Rank-gated, private - only problem owner sees)
    --> [AI/Algorithm Matching] (System recommends best solutions)
    --> [Problem Owner Selection] (Accepts best solution)
```

---

## 3. Data Models

### 3.1 Solution Entity

```typescript
interface Solution {
  id: string;
  problemId: string;
  
  // Author Info
  authorId: string;
  authorName: string;
  authorPhotoUrl: string;
  authorRank: 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
  authorPoints: number;
  
  // Solution Content
  title: string;
  description: string;         // Detailed explanation
  
  // Attachments (Universal Template)
  attachments: Attachment[];
  
  // Implementation Details
  implementationApproach: string;
  resourcesNeeded: string;
  estimatedTimeline: string;
  
  // Metadata
  status: 'submitted' | 'recommended' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  
  // AI Analysis (future)
  aiScore?: number;
  aiRecommendation?: string;
}
```

### 3.2 Attachment Universal Template

```typescript
type AttachmentType = 'image' | 'video' | 'document' | 'link';

interface Attachment {
  id: string;
  type: AttachmentType;
  url: string;
  caption?: string;
  thumbnailUrl?: string;  // For video preview
  order: number;          // Display order in solution
}
```

### 3.3 User Ranking System

```typescript
interface UserRankProfile {
  userId: string;
  currentRank: Rank;
  points: number;
  rankHistory: RankChange[];
  problemsSolved: number;
  solutionsAccepted: number;
  totalContributions: number;
}

type Rank = 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

interface RankChange {
  fromRank: Rank;
  toRank: Rank;
  changedAt: Date;
  reason: 'solutions_accepted' | 'problems_solved' | 'contributions';
}
```

### 3.4 Problem Difficulty & Access

```typescript
// Problem difficulty determines minimum rank required to submit solution
type ProblemDifficulty = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert';

// Access mapping
const RANK_ACCESS_MAP: Record<Rank, ProblemDifficulty[]> = {
  'F': ['beginner'],
  'E': ['beginner', 'easy'],
  'D': ['beginner', 'easy', 'medium'],
  'C': ['beginner', 'easy', 'medium', 'hard'],
  'B': ['beginner', 'easy', 'medium', 'hard'],
  'A': ['beginner', 'easy', 'medium', 'hard', 'expert'],
  'S': ['beginner', 'easy', 'medium', 'hard', 'expert']  // Can solve all
};

// Points System
const RANK_POINTS = {
  solutionSubmitted: 10,
  solutionRecommended: 25,
  solutionAccepted: 100,
  problemSolved: 50,
  dailyActive: 5,
  qualityContribution: 20
};

const RANK_THRESHOLDS = {
  'E': 100,
  'D': 300,
  'C': 600,
  'B': 1000,
  'A': 2000,
  'S': 5000
};
```

### 3.5 Problem Enhancement

```typescript
interface Problem {
  // ... existing fields ...
  
  // NEW: Difficulty & Access
  difficulty: ProblemDifficulty;
  minRankRequired: Rank;
  
  // NEW: Solution tracking
  solutionCount: number;
  acceptedSolutionId?: string;
  
  // NEW: Collaboration
  collabSessionId?: string;
}
```

---

## 4. API Endpoints

### 4.1 Solution APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/problems/:id/solutions` | Submit a solution (rank-gated) |
| GET | `/api/problems/:id/solutions` | Get solutions (owner only) |
| GET | `/api/solutions/:id` | Get single solution |
| PUT | `/api/solutions/:id` | Update solution |
| DELETE | `/api/solutions/:id` | Delete own solution |
| POST | `/api/solutions/:id/recommend` | Get AI recommendation for solution |

### 4.2 Collaboration APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/problems/:id/discussion` | Get brainstorming messages |
| POST | `/api/problems/:id/discussion` | Add to brainstorm (anyone logged in) |

### 4.3 Ranking APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/:id/rank` | Get user rank profile |
| GET | `/api/users/:id/eligible-problems` | Get problems user can solve |

---

## 5. UI/UX Design

### 5.1 Solution Editor Component

**Page:** `/problems/[id]/submit-solution`

**Sections:**
1. **Problem Summary** (read-only, collapsible)
   - Title, Description, Impacts, Challenges
   - "View Full Problem" link

2. **Solution Form**
   - Title Input (required, min 10 chars)
   - Description Textarea (required, min 100 chars, rich text)
   
3. **Attachments Section**
   - "Add Attachment" button
   - Drag & drop zone
   - Supports: Images (jpg, png, gif), Videos (mp4, webm), Documents (pdf), Links
   - Thumbnail preview for images/videos
   - Reorderable list
   
4. **Implementation Details** (optional but encouraged)
   - Implementation Approach textarea
   - Resources Needed textarea
   - Estimated Timeline dropdown (1 week, 2 weeks, 1 month, 3 months, 6 months+)

5. **Preview & Submit**
   - Live preview of how solution looks
   - Rank requirement indicator
   - Submit button

### 5.2 Solution Visibility Rules

| User Role | Can See Solutions |
|-----------|-------------------|
| Problem Owner | All solutions submitted to their problem |
| Solution Author | Only their own solution |
| Other Users | Cannot see any solutions (privacy) |
| Admin | Can see all (moderation) |

### 5.3 Problem Owner Dashboard

**Page:** `/problems/[id]/solutions`

**Shows:**
- List of submitted solutions
- Each solution shows: Author name, rank badge, submission date, title
- "View Details" button to see full solution
- "Recommend" button (triggers AI analysis)
- "Accept" button to mark as accepted solution
- Filter: All / Recommended / Pending

### 5.4 Collaboration "Brainstorm" Section

**Location:** Same page as problem, separate tab

**Features:**
- Anyone logged in can post ideas/thoughts
- Not a solution - just discussion
- Public visibility (helps gather diverse perspectives)
- Different from "Discussion" tab (which is about the problem itself)

---

## 6. Feature States

### 6.1 Rank Progression Display

```
Rank Badge Design:
[F] Bronze - "Novice Solver"
[E] Bronze - "Apprentice"
[D] Silver - "Junior Solver"
[C] Silver - "Skilled Solver"
[B] Gold - "Expert Solver"
[A] Platinum - "Master Solver"
[S] Diamond - "Elite Innovator" (top 1%)
```

### 6.2 Problem Access Indicator

On each problem card, show:
```
[Easy] | [Medium] | [Hard] | [Expert]
   ^-- Clicking shows "Requires Rank D or higher"
```

### 6.3 Solution Submission Flow

1. User clicks "Submit Solution" on a problem
2. System checks: Logged in? + Has required rank?
3. If pass: Show solution form
4. If fail: Show "Rank Up Required" message with link to see eligible problems

---

## 7. Future AI Integration (Phase 2)

### 7.1 Solution Matching Algorithm

```
Input: All solutions for a problem
Process:
  1. Parse solution content
  2. Score against problem requirements
  3. Check feasibility indicators
  4. Compare resource requirements
  5. Generate recommendation score
  
Output: Ranked list of solutions with recommendation scores
```

### 7.2 Recommendation Types
- "Highly Recommended" (score > 80)
- "Recommended" (score 60-80)
- "Consider" (score 40-60)
- "Needs Review" (score < 40)

---

## 8. Implementation Priority

### Phase 1: Core Solution System
- [ ] Solution data model + types
- [ ] Solution submission API
- [ ] Solution editor UI component
- [ ] Problem owner solution view
- [ ] Attachment upload system

### Phase 2: Ranking System
- [ ] User rank profile model
- [ ] Points calculation logic
- [ ] Rank upgrade automation
- [ ] Problem difficulty selector
- [ ] Access control on solution submission

### Phase 3: Collaboration Enhancement
- [ ] Brainstorm section (separate from discussion)
- [ ] Idea voting on brainstorm
- [ ] Real-time collaboration features

### Phase 4: AI Integration
- [ ] Solution scoring algorithm
- [ ] Recommendation engine
- [ ] Auto-match best solutions

---

## 9. Database Schema (Firestore)

```
collections:
  - solutions
    | id (doc id)
    | problemId
    | authorId
    | title
    | description
    | attachments[] 
    | implementationApproach
    | resourcesNeeded
    | estimatedTimeline
    | status
    | createdAt
  
  - userRanks
    | userId (doc id)
    | currentRank
    | points
    | problemsSolved
    | solutionsAccepted
    | rankHistory[]
```

---

## 10. Security & Privacy Rules

| Action | Rule |
|--------|------|
| Submit Solution | User must be logged in + have required rank |
| View Solutions | Only problem owner can view all solutions |
| Edit Solution | Only solution author can edit their solution |
| Delete Solution | Only solution author can delete |
| Accept Solution | Only problem owner can accept |
| View Rankings | Public (show badges) but points private |

---

## 11. Acceptance Criteria

1. User can submit solution with text, images, videos
2. Solution visibility is restricted to problem owner only
3. Ranking system tracks user contributions and upgrades rank
4. Problems show difficulty level and required minimum rank
5. Only users with equal or higher rank can submit to a problem
6. Problem owner can view, recommend, and accept solutions
7. Collaboration section allows brainstorming without solution commitment

---

*End of Design Document*