package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// ProblemDifficulty represents the difficulty level of a problem
type ProblemDifficulty string

const (
	DifficultyBeginner ProblemDifficulty = "beginner"
	DifficultyEasy     ProblemDifficulty = "easy"
	DifficultyMedium   ProblemDifficulty = "medium"
	DifficultyHard     ProblemDifficulty = "hard"
	DifficultyExpert   ProblemDifficulty = "expert"
)

// SolutionStatus represents the status of a solution
type SolutionStatus string

const (
	SolutionStatusSubmitted   SolutionStatus = "submitted"
	SolutionStatusRecommended SolutionStatus = "recommended"
	SolutionStatusAccepted    SolutionStatus = "accepted"
	SolutionStatusRejected    SolutionStatus = "rejected"
)

// Attachment represents a file/link attachment in a solution
type Attachment struct {
	ID           string `json:"id"`
	Type         string `json:"type"` // "image" | "video" | "document" | "link"
	URL          string `json:"url"`
	Caption      string `json:"caption,omitempty"`
	ThumbnailURL string `json:"thumbnailUrl,omitempty"`
	Order        int    `json:"order"`
}

// Solution represents a solution submitted to a problem
type Solution struct {
	ID                   uuid.UUID       `json:"id"`
	ProblemID            uuid.UUID       `json:"problemId"`
	AuthorID             uuid.UUID       `json:"authorId"`
	AuthorName           string          `json:"authorName"`
	AuthorPhotoURL       string          `json:"authorPhotoUrl"`
	AuthorRank           Rank            `json:"authorRank"`
	AuthorPoints         int             `json:"authorPoints"`
	Title                string          `json:"title"`
	Description          string          `json:"description"`
	Attachments          []Attachment    `json:"attachments"`
	ImplementationApproach string        `json:"implementationApproach,omitempty"`
	ResourcesNeeded      string          `json:"resourcesNeeded,omitempty"`
	EstimatedTimeline    string          `json:"estimatedTimeline,omitempty"`
	Status               SolutionStatus `json:"status"`
	VotesCount           int             `json:"votesCount"`
	HasVoted             bool            `json:"hasVoted"` // Whether current user has voted
	CreatedAt            time.Time       `json:"createdAt"`
	UpdatedAt            time.Time       `json:"updatedAt"`
}

// SolutionRepository defines persistence operations for solutions
type SolutionRepository interface {
	// Create persists a new solution and populates its ID and timestamps
	Create(ctx context.Context, s *Solution) error
	// FindByID returns the solution or ErrNotFound
	FindByID(ctx context.Context, id uuid.UUID) (*Solution, error)
	// FindByProblemID returns all solutions for a problem
	FindByProblemID(ctx context.Context, problemID uuid.UUID) ([]Solution, error)
	// FindByAuthorID returns all solutions by a user
	FindByAuthorID(ctx context.Context, authorID uuid.UUID) ([]Solution, error)
	// Update persists changes to an existing solution
	Update(ctx context.Context, s *Solution) error
	// Delete removes a solution by ID
	Delete(ctx context.Context, id uuid.UUID) error
	// IncrementSolutions atomically increments solution_count on a problem
	IncrementSolutions(ctx context.Context, problemID uuid.UUID, delta int) error
	// IncrementVotes atomically increments votes_count on a solution
	IncrementVotes(ctx context.Context, solutionID uuid.UUID, delta int) error
	// FindSolutionVote returns the vote if the user has voted, or ErrNotFound
	FindSolutionVote(ctx context.Context, userID, solutionID uuid.UUID) error
	// CreateSolutionVote records a new vote
	CreateSolutionVote(ctx context.Context, userID, solutionID uuid.UUID) error
	// DeleteSolutionVote removes an existing vote
	DeleteSolutionVote(ctx context.Context, userID, solutionID uuid.UUID) error
	// HasUserVotedSolutions returns a set of solutionIDs the user has voted on
	HasUserVotedSolutions(ctx context.Context, userID uuid.UUID, solutionIDs []uuid.UUID) (map[uuid.UUID]bool, error)
}