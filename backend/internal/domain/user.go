package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// User represents an authenticated user in the domain.
// GoogleID is the stable sub claim from Google's ID token.
type User struct {
	ID          uuid.UUID `json:"id"`
	GoogleID    string    `json:"googleId"`
	Email       string    `json:"email"`
	DisplayName string    `json:"displayName"`
	PhotoURL    string    `json:"photoURL"`
	CreatedAt   time.Time `json:"createdAt"`
}

// UserProfileDTO represents a comprehensive user profile with aggregated statistics
type UserProfileDTO struct {
	User
	Rank               string        `json:"rank"`
	Points             int           `json:"points"`
	ProblemsSolved     int           `json:"problems_solved"`
	SolutionsAccepted  int           `json:"solutions_accepted"`
	TotalContributions int           `json:"total_contributions"`
	ProblemsAuthored   int           `json:"problems_authored"`
	RecentActivity     []ActivityDTO `json:"recent_activity"`
}

// ActivityDTO represents a recently viewed problem
type ActivityDTO struct {
	ProblemID   uuid.UUID `json:"problemId"`
	ProblemName string    `json:"problemName"`
	Category    string    `json:"category"`
	ViewedAt    time.Time `json:"viewedAt"`
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
	// Update modifies editable fields (display_name, photo_url) for the given user.
	Update(ctx context.Context, u *User) error
	// GetProfileStatsByID returns a comprehensive user profile with stats.
	GetProfileStatsByID(ctx context.Context, id uuid.UUID) (*UserProfileDTO, error)
}
