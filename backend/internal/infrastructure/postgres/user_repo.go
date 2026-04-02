package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/RohitSadawarte79/solvinghub-backend/internal/domain"
	"github.com/google/uuid"
)

// UserRepo implements domain.UserRepository using PostgreSQL.
type UserRepo struct {
	db *sql.DB
}

// NewUserRepo constructs a UserRepo.
func NewUserRepo(db *sql.DB) *UserRepo {
	return &UserRepo{db: db}
}

// FindByGoogleID returns the user with the given Google sub claim, or domain.ErrNotFound.
func (r *UserRepo) FindByGoogleID(ctx context.Context, googleID string) (*domain.User, error) {
	const q = `
		SELECT id, google_id, email, display_name, photo_url, created_at
		FROM users
		WHERE google_id = $1`

	u := &domain.User{}
	err := r.db.QueryRowContext(ctx, q, googleID).Scan(
		&u.ID, &u.GoogleID, &u.Email, &u.DisplayName, &u.PhotoURL, &u.CreatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("userRepo.FindByGoogleID: %w", err)
	}
	return u, nil
}

// FindByID returns the user with the given UUID, or domain.ErrNotFound.
func (r *UserRepo) FindByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	const q = `
		SELECT id, google_id, email, display_name, photo_url, created_at
		FROM users
		WHERE id = $1`

	u := &domain.User{}
	err := r.db.QueryRowContext(ctx, q, id).Scan(
		&u.ID, &u.GoogleID, &u.Email, &u.DisplayName, &u.PhotoURL, &u.CreatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("userRepo.FindByID: %w", err)
	}
	return u, nil
}

// Upsert inserts a new user or updates their display_name and photo_url on conflict.
// This is called every time a user logs in via Google OAuth.
func (r *UserRepo) Upsert(ctx context.Context, u *domain.User) error {
	const q = `
		INSERT INTO users (id, google_id, email, display_name, photo_url)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (google_id) DO UPDATE
		  SET display_name = EXCLUDED.display_name,
		      photo_url    = EXCLUDED.photo_url
		RETURNING id, created_at`

	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}

	return r.db.QueryRowContext(ctx, q,
		u.ID, u.GoogleID, u.Email, u.DisplayName, u.PhotoURL,
	).Scan(&u.ID, &u.CreatedAt)
}
