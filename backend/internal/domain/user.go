package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// User represents an authenticated user in the domain.
// GoogleID is the stable sub claim from Google's ID token.
type User struct {
	ID          uuid.UUID
	GoogleID    string
	Email       string
	DisplayName string
	PhotoURL    string
	CreatedAt   time.Time
}

// UserRepository defines the persistence contract for users.
// Implementations live in internal/infrastructure/postgres/.
type UserRepository interface {
	// FindByGoogleID returns the user matching the Google sub claim, or ErrNotFound.
	FindByGoogleID(ctx context.Context, googleID string) (*User, error)
	// FindByID returns the user matching the given UUID, or ErrNotFound.
	FindByID(ctx context.Context, id uuid.UUID) (*User, error)
	// Upsert creates the user if they don't exist, or updates their profile if they do.
	Upsert(ctx context.Context, u *User) error
}
