package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/RohitSadawarte79/solvinghub-backend/internal/domain"
	"github.com/google/uuid"
)

// UserRankRepo implements domain.UserRankRepository using PostgreSQL.
type UserRankRepo struct {
	db *sql.DB
}

// NewUserRankRepo constructs a UserRankRepo.
func NewUserRankRepo(db *sql.DB) *UserRankRepo {
	return &UserRankRepo{db: db}
}

// Get returns the user's rank profile.
func (r *UserRankRepo) Get(ctx context.Context, userID uuid.UUID) (*domain.UserRankProfile, error) {
	const q = `
		SELECT user_id, current_rank, points, problems_solved, solutions_accepted, total_contributions
		FROM user_ranks
		WHERE user_id = $1`

	p := &domain.UserRankProfile{}
	err := r.db.QueryRowContext(ctx, q, userID).Scan(
		&p.UserID, &p.CurrentRank, &p.Points,
		&p.ProblemsSolved, &p.SolutionsAccepted, &p.TotalContributions,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("userRankRepo.Get: %w", err)
	}
	return p, nil
}

// Upsert creates or updates a user's rank profile.
func (r *UserRankRepo) Upsert(ctx context.Context, profile *domain.UserRankProfile) error {
	const q = `
		INSERT INTO user_ranks (user_id, current_rank, points, problems_solved, solutions_accepted, total_contributions)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (user_id) DO UPDATE SET
			current_rank = EXCLUDED.current_rank,
			points = EXCLUDED.points,
			problems_solved = EXCLUDED.problems_solved,
			solutions_accepted = EXCLUDED.solutions_accepted,
			total_contributions = EXCLUDED.total_contributions,
			updated_at = NOW()`

	_, err := r.db.ExecContext(ctx, q,
		profile.UserID, profile.CurrentRank, profile.Points,
		profile.ProblemsSolved, profile.SolutionsAccepted, profile.TotalContributions,
	)
	if err != nil {
		return fmt.Errorf("userRankRepo.Upsert: %w", err)
	}
	return nil
}

// Rank thresholds for progression
var rankThresholds = map[domain.Rank]int{
	domain.RankE: 100,
	domain.RankD: 300,
	domain.RankC: 600,
	domain.RankB: 1000,
	domain.RankA: 2000,
	domain.RankS: 5000,
}

// GetLeaderboard returns top users by points (with pagination)
func (r *UserRankRepo) GetLeaderboard(ctx context.Context, limit, offset int) ([]*domain.UserRankProfile, error) {
	const q = `
		SELECT user_id, current_rank, points, problems_solved, solutions_accepted, total_contributions
		FROM user_ranks
		ORDER BY points DESC, created_at ASC
		LIMIT $1 OFFSET $2`

	rows, err := r.db.QueryContext(ctx, q, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("userRankRepo.GetLeaderboard: %w", err)
	}
	defer rows.Close()

	var profiles []*domain.UserRankProfile
	for rows.Next() {
		p := &domain.UserRankProfile{}
		err := rows.Scan(
			&p.UserID, &p.CurrentRank, &p.Points,
			&p.ProblemsSolved, &p.SolutionsAccepted, &p.TotalContributions,
		)
		if err != nil {
			return nil, fmt.Errorf("userRankRepo.GetLeaderboard: scan error: %w", err)
		}
		profiles = append(profiles, p)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("userRankRepo.GetLeaderboard: rows error: %w", err)
	}

	return profiles, nil
}

// GetRankDistribution returns the count of users at each rank level
func (r *UserRankRepo) GetRankDistribution(ctx context.Context) (map[domain.Rank]int, error) {
	const q = `
		SELECT current_rank, COUNT(*)
		FROM user_ranks
		GROUP BY current_rank`

	rows, err := r.db.QueryContext(ctx, q)
	if err != nil {
		return nil, fmt.Errorf("userRankRepo.GetRankDistribution: %w", err)
	}
	defer rows.Close()

	distribution := make(map[domain.Rank]int)
	for rows.Next() {
		var rank string
		var count int
		err := rows.Scan(&rank, &count)
		if err != nil {
			return nil, fmt.Errorf("userRankRepo.GetRankDistribution: scan error: %w", err)
		}
		distribution[domain.Rank(rank)] = count
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("userRankRepo.GetRankDistribution: rows error: %w", err)
	}

	return distribution, nil
}

// AddPoints adds points to a user's profile and returns the new rank.
func (r *UserRankRepo) AddPoints(ctx context.Context, userID uuid.UUID, points int) (domain.Rank, error) {
	// First get current profile or create default
	profile, err := r.Get(ctx, userID)
	if errors.Is(err, domain.ErrNotFound) {
		profile = &domain.UserRankProfile{
			UserID:      userID,
			CurrentRank: domain.RankF,
			Points:      0,
		}
	} else if err != nil {
		return "", err
	}

	// Add points
	profile.Points += points
	profile.TotalContributions++

	// Check for rank up
	newRank := profile.CurrentRank
	for rank, threshold := range rankThresholds {
		if profile.Points >= threshold && rank > profile.CurrentRank {
			newRank = rank
		}
	}
	profile.CurrentRank = newRank

	// Update in database
	if err := r.Upsert(ctx, profile); err != nil {
		return "", err
	}

	return newRank, nil
}