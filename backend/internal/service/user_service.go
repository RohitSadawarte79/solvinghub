package service

import (
	"context"
	"fmt"

	"github.com/RohitSadawarte79/solvinghub-backend/internal/domain"
	"github.com/google/uuid"
)

// UserService contains business logic for users.
type UserService struct {
	users domain.UserRepository
}

// NewUserService constructs a UserService.
func NewUserService(users domain.UserRepository) *UserService {
	return &UserService{users: users}
}

// GetByID returns a user or domain.ErrNotFound.
func (s *UserService) GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	return s.users.FindByID(ctx, id)
}

// GetProfileByID returns a comprehensive UserProfileDTO or domain.ErrNotFound.
func (s *UserService) GetProfileByID(ctx context.Context, id uuid.UUID) (*domain.UserProfileDTO, error) {
	return s.users.GetProfileStatsByID(ctx, id)
}

// Update applies edits to a user profile. Only the owner may edit.
func (s *UserService) Update(ctx context.Context, id, requestingUserID uuid.UUID, displayName, photoURL string) error {
	if id != requestingUserID {
		return domain.ErrForbidden
	}

	existing, err := s.users.FindByID(ctx, id)
	if err != nil {
		return err
	}

	// Apply edits — ID stays immutable
	if displayName != "" {
		existing.DisplayName = displayName
	}
	if photoURL != "" {
		existing.PhotoURL = photoURL
	}

	if existing.DisplayName == "" {
		return fmt.Errorf("%w: display name cannot be empty", domain.ErrInvalidInput)
	}

	return s.users.Update(ctx, existing)
}
