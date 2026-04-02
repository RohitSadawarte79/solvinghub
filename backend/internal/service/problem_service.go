package service

import (
	"context"
	"fmt"

	"github.com/RohitSadawarte79/solvinghub-backend/internal/domain"
	"github.com/google/uuid"
)

// ProblemService contains business logic for problems.
// It depends only on domain interfaces — no infrastructure imports.
type ProblemService struct {
	problems domain.ProblemRepository
}

// NewProblemService constructs a ProblemService.
func NewProblemService(problems domain.ProblemRepository) *ProblemService {
	return &ProblemService{problems: problems}
}

// Create validates and persists a new problem.
func (s *ProblemService) Create(ctx context.Context, p *domain.Problem) error {
	if p.Title == "" {
		return fmt.Errorf("%w: title is required", domain.ErrInvalidInput)
	}
	if len(p.Title) < 10 {
		return fmt.Errorf("%w: title must be at least 10 characters", domain.ErrInvalidInput)
	}
	if p.Description == "" {
		return fmt.Errorf("%w: description is required", domain.ErrInvalidInput)
	}
	if len(p.Description) < 50 {
		return fmt.Errorf("%w: description must be at least 50 characters", domain.ErrInvalidInput)
	}
	if p.Category == "" {
		return fmt.Errorf("%w: category is required", domain.ErrInvalidInput)
	}
	return s.problems.Create(ctx, p)
}

// GetByID returns a problem or domain.ErrNotFound.
func (s *ProblemService) GetByID(ctx context.Context, id uuid.UUID) (*domain.Problem, error) {
	return s.problems.FindByID(ctx, id)
}

// List returns all problems sorted by the given parameters.
func (s *ProblemService) List(ctx context.Context, params domain.ListParams) ([]domain.Problem, error) {
	return s.problems.List(ctx, params)
}

// ListByUser returns problems submitted by the given user.
func (s *ProblemService) ListByUser(ctx context.Context, userID uuid.UUID) ([]domain.Problem, error) {
	return s.problems.ListByUserID(ctx, userID)
}

// Update applies edits to a problem. Only the owner may edit.
func (s *ProblemService) Update(ctx context.Context, id, requestingUserID uuid.UUID, patch *domain.Problem) error {
	existing, err := s.problems.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if existing.SubmittedByID != requestingUserID {
		return domain.ErrForbidden
	}

	// Apply patch fields
	existing.Title = patch.Title
	existing.Description = patch.Description
	existing.Category = patch.Category
	existing.Tags = patch.Tags
	existing.Impacts = patch.Impacts
	existing.Challenges = patch.Challenges

	return s.problems.Update(ctx, existing)
}

// Delete removes a problem. Only the owner may delete.
func (s *ProblemService) Delete(ctx context.Context, id, requestingUserID uuid.UUID) error {
	existing, err := s.problems.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if existing.SubmittedByID != requestingUserID {
		return domain.ErrForbidden
	}
	return s.problems.Delete(ctx, id)
}
