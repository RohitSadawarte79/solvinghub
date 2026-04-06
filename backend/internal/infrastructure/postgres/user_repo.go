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

// Update modifies editable fields for the given user. The ID is immutable.
func (r *UserRepo) Update(ctx context.Context, u *domain.User) error {
	const q = `
		UPDATE users
		SET display_name = $1, photo_url = $2
		WHERE id = $3`

	res, err := r.db.ExecContext(ctx, q, u.DisplayName, u.PhotoURL, u.ID)
	if err != nil {
		return fmt.Errorf("userRepo.Update: %w", err)
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return domain.ErrNotFound
	}
	return nil
}

// GetProfileStatsByID returns a comprehensive user profile with stats and recent activity.
func (r *UserRepo) GetProfileStatsByID(ctx context.Context, id uuid.UUID) (*domain.UserProfileDTO, error) {
	const q = `
		SELECT 
			u.id, u.google_id, u.email, u.display_name, u.photo_url, u.created_at,
			COALESCE(ur.current_rank, 'F'),
			COALESCE(ur.points, 0),
			(SELECT COUNT(*) FROM problems WHERE submitted_by_id = u.id),
			COALESCE(ur.problems_solved, 0),
			COALESCE(ur.solutions_accepted, 0),
			COALESCE(ur.total_contributions, 0)
		FROM users u
		LEFT JOIN user_ranks ur ON u.id = ur.user_id
		WHERE u.id = $1`

	dto := &domain.UserProfileDTO{}
	err := r.db.QueryRowContext(ctx, q, id).Scan(
		&dto.ID, &dto.GoogleID, &dto.Email, &dto.DisplayName, &dto.PhotoURL, &dto.CreatedAt,
		&dto.Rank, &dto.Points,
		&dto.ProblemsAuthored, &dto.ProblemsSolved, &dto.SolutionsAccepted, &dto.TotalContributions,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("userRepo.GetProfileStatsByID: %w", err)
	}

	// Fetch recent activity
	const qActivity = `
		SELECT upv.problem_id, p.title, p.category, upv.viewed_at
		FROM user_problem_views upv
		JOIN problems p ON upv.problem_id = p.id
		WHERE upv.user_id = $1
		ORDER BY upv.viewed_at DESC
		LIMIT 5`

	rows, err := r.db.QueryContext(ctx, qActivity, id)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var act domain.ActivityDTO
			if err := rows.Scan(&act.ProblemID, &act.ProblemName, &act.Category, &act.ViewedAt); err == nil {
				dto.RecentActivity = append(dto.RecentActivity, act)
			}
		}
	} else {
		// Just log the error, don't fail the profile load
		fmt.Printf("userRepo.GetProfileStatsByID (activity warning): %v\n", err)
	}

	if dto.RecentActivity == nil {
		dto.RecentActivity = make([]domain.ActivityDTO, 0)
	}

	return dto, nil
}
