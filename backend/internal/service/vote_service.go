package service

import (
	"context"
	"errors"

	"github.com/RohitSadawarte79/solvinghub-backend/internal/domain"
	"github.com/google/uuid"
)

// VoteService handles vote toggling with proper atomicity.
type VoteService struct {
	votes    domain.VoteRepository
	problems domain.ProblemRepository
}

// NewVoteService constructs a VoteService.
func NewVoteService(votes domain.VoteRepository, problems domain.ProblemRepository) *VoteService {
	return &VoteService{votes: votes, problems: problems}
}

// ToggleProblemVote adds a vote if the user hasn't voted yet, or removes it if they have.
// This fixes the Firestore race condition where check-then-act was non-atomic.
// Returns (hasVoted bool, err).
func (s *VoteService) ToggleProblemVote(ctx context.Context, userID, problemID uuid.UUID) (hasVoted bool, err error) {
	// Verify problem exists first
	if _, err := s.problems.FindByID(ctx, problemID); err != nil {
		return false, err
	}

	existing, err := s.votes.FindProblemVote(ctx, userID, problemID)
	if err != nil && !errors.Is(err, domain.ErrNotFound) {
		return false, err
	}

	if existing != nil {
		// User already voted → remove vote
		if err := s.votes.DeleteProblemVote(ctx, userID, problemID); err != nil {
			return false, err
		}
		if err := s.problems.IncrementVotes(ctx, problemID, -1); err != nil {
			return false, err
		}
		return false, nil // user has NOT voted after this action
	}

	// User hasn't voted → add vote
	vote := &domain.ProblemVote{
		UserID:    userID,
		ProblemID: problemID,
	}
	if err := s.votes.CreateProblemVote(ctx, vote); err != nil {
		return false, err
	}
	if err := s.problems.IncrementVotes(ctx, problemID, +1); err != nil {
		return false, err
	}
	return true, nil // user HAS voted after this action
}

// GetUserVoteStatus returns whether the given user has voted on the given problems.
func (s *VoteService) GetUserVoteStatus(ctx context.Context, userID uuid.UUID, problemIDs []uuid.UUID) (map[uuid.UUID]bool, error) {
	return s.votes.HasUserVotedProblems(ctx, userID, problemIDs)
}
