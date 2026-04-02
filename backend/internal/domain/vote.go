package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// ProblemVote records that a user voted on a problem.
type ProblemVote struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	ProblemID uuid.UUID
	CreatedAt time.Time
}

// VoteRepository defines persistence for voting (both problems and comments).
type VoteRepository interface {
	// FindProblemVote returns the vote if the user has voted, or ErrNotFound.
	FindProblemVote(ctx context.Context, userID, problemID uuid.UUID) (*ProblemVote, error)
	// CreateProblemVote records a new vote.
	CreateProblemVote(ctx context.Context, v *ProblemVote) error
	// DeleteProblemVote removes an existing vote.
	DeleteProblemVote(ctx context.Context, userID, problemID uuid.UUID) error
	// HasUserVotedProblems returns a set of problemIDs the user has voted on.
	// Used to populate the voted state when listing problems.
	HasUserVotedProblems(ctx context.Context, userID uuid.UUID, problemIDs []uuid.UUID) (map[uuid.UUID]bool, error)
}
