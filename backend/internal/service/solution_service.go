package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/RohitSadawarte79/solvinghub-backend/internal/domain"
	"github.com/google/uuid"
)

// SolutionService contains business logic for solutions.
type SolutionService struct {
	solutions  domain.SolutionRepository
	problems   domain.ProblemRepository
	userRanks  domain.UserRankRepository
}

// NewSolutionService constructs a SolutionService.
func NewSolutionService(
	solutions domain.SolutionRepository,
	problems domain.ProblemRepository,
	userRanks domain.UserRankRepository,
) *SolutionService {
	return &SolutionService{
		solutions: solutions,
		problems:  problems,
		userRanks: userRanks,
	}
}

// ToggleSolutionVote adds a vote if user hasn't voted, or removes it if they have.
// Returns (hasVoted bool, err).
func (s *SolutionService) ToggleSolutionVote(ctx context.Context, userID, solutionID uuid.UUID) (hasVoted bool, err error) {
	// Verify solution exists first
	if _, err := s.solutions.FindByID(ctx, solutionID); err != nil {
		return false, err
	}

	// Check if user has already voted
	err = s.solutions.FindSolutionVote(ctx, userID, solutionID)
	if err == nil {
		// User already voted → remove vote
		if err := s.solutions.DeleteSolutionVote(ctx, userID, solutionID); err != nil {
			return false, err
		}
		if err := s.solutions.IncrementVotes(ctx, solutionID, -1); err != nil {
			return false, err
		}
		return false, nil // user has NOT voted after this action
	}

	if !errors.Is(err, domain.ErrNotFound) {
		return false, err
	}

	// User hasn't voted → add vote
	if err := s.solutions.CreateSolutionVote(ctx, userID, solutionID); err != nil {
		return false, err
	}
	if err := s.solutions.IncrementVotes(ctx, solutionID, +1); err != nil {
		return false, err
	}
	return true, nil // user HAS voted after this action
}

// RankAccessMap defines which difficulties each rank can access
var RankAccessMap = map[domain.Rank][]domain.ProblemDifficulty{
	domain.RankF: {domain.DifficultyBeginner},
	domain.RankE: {domain.DifficultyBeginner, domain.DifficultyEasy},
	domain.RankD: {domain.DifficultyBeginner, domain.DifficultyEasy, domain.DifficultyMedium},
	domain.RankC: {domain.DifficultyBeginner, domain.DifficultyEasy, domain.DifficultyMedium, domain.DifficultyHard},
	domain.RankB: {domain.DifficultyBeginner, domain.DifficultyEasy, domain.DifficultyMedium, domain.DifficultyHard},
	domain.RankA: {domain.DifficultyBeginner, domain.DifficultyEasy, domain.DifficultyMedium, domain.DifficultyHard, domain.DifficultyExpert},
	domain.RankS: {domain.DifficultyBeginner, domain.DifficultyEasy, domain.DifficultyMedium, domain.DifficultyHard, domain.DifficultyExpert},
}

// CanSubmitSolution checks if a user can submit a solution based on rank and problem difficulty
func (s *SolutionService) CanSubmitSolution(ctx context.Context, userID uuid.UUID, problemID uuid.UUID) (bool, string, error) {
	// Get user's rank profile
	profile, err := s.userRanks.Get(ctx, userID)
	if err != nil {
		// If no rank profile exists, user is at rank F
		profile = &domain.UserRankProfile{
			UserID:      userID,
			CurrentRank: domain.RankF,
			Points:      0,
		}
	}

	// Get the problem
	problem, err := s.problems.FindByID(ctx, problemID)
	if err != nil {
		return false, "", err
	}

	// Check difficulty - default to medium if not set
	difficulty := domain.ProblemDifficulty(problem.Difficulty)
	if difficulty == "" {
		difficulty = domain.DifficultyMedium
	}

	// Get allowed difficulties for user's rank
	allowedDiffs, ok := RankAccessMap[profile.CurrentRank]
	if !ok {
		allowedDiffs = []domain.ProblemDifficulty{domain.DifficultyBeginner}
	}

	// Check if user's rank can access this difficulty
	for _, allowed := range allowedDiffs {
		if allowed == difficulty {
			return true, "", nil
		}
	}

	return false, fmt.Sprintf("Requires rank %s or higher for %s difficulty", getNextRank(profile.CurrentRank), difficulty), nil
}

func getNextRank(r domain.Rank) string {
	switch r {
	case domain.RankF:
		return "E"
	case domain.RankE:
		return "D"
	case domain.RankD:
		return "C"
	case domain.RankC:
		return "B"
	case domain.RankB:
		return "A"
	default:
		return "S"
	}
}

// Create validates and persists a new solution.
func (s *SolutionService) Create(ctx context.Context, sol *domain.Solution) error {
	if sol.Title == "" {
		return fmt.Errorf("%w: title is required", domain.ErrInvalidInput)
	}
	if len(sol.Title) < 10 {
		return fmt.Errorf("%w: title must be at least 10 characters", domain.ErrInvalidInput)
	}
	if sol.Description == "" {
		return fmt.Errorf("%w: description is required", domain.ErrInvalidInput)
	}
	if len(sol.Description) < 100 {
		return fmt.Errorf("%w: description must be at least 100 characters", domain.ErrInvalidInput)
	}
	if sol.ProblemID == uuid.Nil {
		return fmt.Errorf("%w: problemId is required", domain.ErrInvalidInput)
	}

	// Verify problem exists
	_, err := s.problems.FindByID(ctx, sol.ProblemID)
	if err != nil {
		return err
	}

	sol.Status = domain.SolutionStatusSubmitted
	if err := s.solutions.Create(ctx, sol); err != nil {
		return err
	}

	// Increment solution count on problem
	return s.solutions.IncrementSolutions(ctx, sol.ProblemID, 1)
}

// GetByID returns a solution or domain.ErrNotFound.
func (s *SolutionService) GetByID(ctx context.Context, id uuid.UUID) (*domain.Solution, error) {
	return s.solutions.FindByID(ctx, id)
}

// GetByProblemID returns all solutions for a problem.
func (s *SolutionService) GetByProblemID(ctx context.Context, problemID uuid.UUID) ([]domain.Solution, error) {
	return s.solutions.FindByProblemID(ctx, problemID)
}

// GetByAuthorID returns all solutions by a user.
func (s *SolutionService) GetByAuthorID(ctx context.Context, authorID uuid.UUID) ([]domain.Solution, error) {
	return s.solutions.FindByAuthorID(ctx, authorID)
}

// Update applies edits to a solution. Only the owner may edit.
func (s *SolutionService) Update(ctx context.Context, id, requestingUserID uuid.UUID, patch *domain.Solution) error {
	existing, err := s.solutions.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if existing.AuthorID != requestingUserID {
		return domain.ErrForbidden
	}

	existing.Title = patch.Title
	existing.Description = patch.Description
	existing.Attachments = patch.Attachments
	existing.ImplementationApproach = patch.ImplementationApproach
	existing.ResourcesNeeded = patch.ResourcesNeeded
	existing.EstimatedTimeline = patch.EstimatedTimeline

	return s.solutions.Update(ctx, existing)
}

// Delete removes a solution. Only the owner may delete.
func (s *SolutionService) Delete(ctx context.Context, id, requestingUserID uuid.UUID) error {
	existing, err := s.solutions.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if existing.AuthorID != requestingUserID {
		return domain.ErrForbidden
	}

	if err := s.solutions.Delete(ctx, id); err != nil {
		return err
	}

	// Decrement solution count on problem
	return s.solutions.IncrementSolutions(ctx, existing.ProblemID, -1)
}

// AcceptSolution marks a solution as accepted. Only the problem owner can do this.
func (s *SolutionService) AcceptSolution(ctx context.Context, solutionID, problemOwnerID uuid.UUID) error {
	solution, err := s.solutions.FindByID(ctx, solutionID)
	if err != nil {
		return err
	}

	problem, err := s.problems.FindByID(ctx, solution.ProblemID)
	if err != nil {
		return err
	}

	// Only problem owner can accept
	if problem.SubmittedByID != problemOwnerID {
		return domain.ErrForbidden
	}

	// Update solution status
	solution.Status = domain.SolutionStatusAccepted
	if err := s.solutions.Update(ctx, solution); err != nil {
		return err
	}

	// Award points to solution author
	_, err = s.userRanks.AddPoints(ctx, solution.AuthorID, 100) // 100 points for accepted solution
	return err
}

// RecommendSolution marks a solution as recommended (for AI/algorithm ranking)
func (s *SolutionService) RecommendSolution(ctx context.Context, solutionID, problemOwnerID uuid.UUID) error {
	solution, err := s.solutions.FindByID(ctx, solutionID)
	if err != nil {
		return err
	}

	problem, err := s.problems.FindByID(ctx, solution.ProblemID)
	if err != nil {
		return err
	}

	// Only problem owner can recommend
	if problem.SubmittedByID != problemOwnerID {
		return domain.ErrForbidden
	}

	solution.Status = domain.SolutionStatusRecommended
	return s.solutions.Update(ctx, solution)
}

// GetUserRank returns a user's rank profile.
func (s *SolutionService) GetUserRank(ctx context.Context, userID uuid.UUID) (*domain.UserRankProfile, error) {
	return s.userRanks.Get(ctx, userID)
}

// Ensure solution belongs to problem owner
func (s *SolutionService) GetSolutionsForProblemOwner(ctx context.Context, problemID, ownerID uuid.UUID) ([]domain.Solution, error) {
	problem, err := s.problems.FindByID(ctx, problemID)
	if err != nil {
		return nil, err
	}
	if problem.SubmittedByID != ownerID {
		return nil, domain.ErrForbidden
	}
	return s.solutions.FindByProblemID(ctx, problemID)
}