package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// Problem is the core aggregate for a posted problem.
type Problem struct {
	ID              uuid.UUID         `json:"id"`
	Title           string            `json:"title"`
	Description     string            `json:"description"`
	Category        string            `json:"category"`
	Tags            []string          `json:"tags"`
	Impacts         []string          `json:"impacts"`
	Challenges      []string          `json:"challenges"`
	VotesCount      int               `json:"votes"`
	CommentsCount   int               `json:"discussions"`
	SolutionCount   int               `json:"solutionCount"`
	Difficulty      ProblemDifficulty `json:"difficulty"`
	MinRankRequired Rank              `json:"minRankRequired"`
	SubmittedByID   uuid.UUID         `json:"submittedById"`
	SubmittedBy     string            `json:"submittedBy"` // display name
	CreatedAt       time.Time         `json:"createdAt"`
	UpdatedAt       time.Time         `json:"lastEditedAt"`
}

// ListParams carries optional filtering and sorting for the List query.
type ListParams struct {
	SortBy  string // "votes" | "discussions" | "timestamp" | "title"
	SortDir string // "asc" | "desc"
}

// ProblemRepository defines persistence operations for problems.
type ProblemRepository interface {
	// Create persists a new problem and populates p.ID and p.CreatedAt.
	Create(ctx context.Context, p *Problem) error
	// FindByID returns the problem or ErrNotFound.
	FindByID(ctx context.Context, id uuid.UUID) (*Problem, error)
	// List returns all problems ordered by params.
	List(ctx context.Context, params ListParams) ([]Problem, error)
	// ListByUserID returns problems submitted by the given user, newest first.
	ListByUserID(ctx context.Context, userID uuid.UUID) ([]Problem, error)
	// Update persists changes to an existing problem.
	// Must only be called after service-layer ownership check.
	Update(ctx context.Context, p *Problem) error
	// Delete removes a problem by ID. Returns ErrNotFound if absent.
	// Ownership must be enforced before calling this.
	Delete(ctx context.Context, id uuid.UUID) error
	// IncrementVotes atomically adjusts the vote count by delta (+1 or -1).
	IncrementVotes(ctx context.Context, id uuid.UUID, delta int) error
	// IncrementComments atomically adjusts the comment count by delta.
	IncrementComments(ctx context.Context, id uuid.UUID, delta int) error
	// UpsertUserView logs that a user viewed a specific problem.
	UpsertUserView(ctx context.Context, userID, problemID uuid.UUID) error
}
