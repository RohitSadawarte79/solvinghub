export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    // Rank and points from backend JWT
    rank?: Rank;
    points?: number;
}

export interface Problem {
    id?: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
    impacts: string[];
    challenges: string[];
    votes?: number;
    discussions?: number;
    createdAt?: string;
    submittedById: string;
    submittedBy: string;
    lastEditedAt?: string;
    // Difficulty for solution access control
    difficulty?: ProblemDifficulty;
    minRankRequired?: Rank;
    solutionCount?: number;
    acceptedSolutionId?: string;
}

export interface Comment {
    id: string;
    problemId: string;
    authorId: string;
    authorName: string;
    authorPhotoUrl: string;
    authorRank?: Rank;
    authorPoints?: number;
    body: string;
    votes: number;
    createdAt: string;
    replies?: Reply[];
}

export interface Reply {
    id: string;
    commentId: string;
    problemId: string;
    authorId: string;
    authorName: string;
    authorPhotoUrl: string;
    authorRank?: Rank;
    authorPoints?: number;
    body: string;
    createdAt: string;
}

// Re-export specific enums or constants if we want strict typing
export type Category =
    | 'Environment'
    | 'Technology'
    | 'Healthcare'
    | 'Education'
    | 'Infrastructure'
    | 'Social'
    | 'Other';

// Problem Difficulty for solution access control
export type ProblemDifficulty = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert';

// User Ranking System
export type Rank = 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

export interface Attachment {
    id: string;
    type: 'image' | 'video' | 'document' | 'link';
    url: string;
    caption?: string;
    thumbnailUrl?: string;
    order: number;
}

export interface Solution {
    id?: string;
    problemId: string;
    
    // Author Info
    authorId: string;
    authorName: string;
    authorPhotoUrl: string;
    authorRank: Rank;
    authorPoints: number;
    
    // Solution Content
    title: string;
    description: string;
    attachments: Attachment[];
    
    // Implementation Details
    implementationApproach?: string;
    resourcesNeeded?: string;
    estimatedTimeline?: string;
    
    // Metadata
    status: 'submitted' | 'recommended' | 'accepted' | 'rejected';
    createdAt?: string;
    updatedAt?: string;
}

export interface UserRankProfile {
    userId: string;
    currentRank: Rank;
    points: number;
    problemsSolved: number;
    solutionsAccepted: number;
    totalContributions: number;
    rankHistory?: {
        fromRank: Rank;
        toRank: Rank;
        changedAt: string;
        reason: string;
    }[];
}
