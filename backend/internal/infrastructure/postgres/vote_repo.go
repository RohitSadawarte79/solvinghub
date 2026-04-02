package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/RohitSadawarte79/solvinghub-backend/internal/domain"
	"github.com/google/uuid"
)

// VoteRepo implements domain.VoteRepository using PostgreSQL.
type VoteRepo struct {
	db *sql.DB
}

// NewVoteRepo constructs a VoteRepo.
func NewVoteRepo(db *sql.DB) *VoteRepo {
	return &VoteRepo{db: db}
}

// FindProblemVote returns the vote row if it exists, or domain.ErrNotFound.
func (r *VoteRepo) FindProblemVote(ctx context.Context, userID, problemID uuid.UUID) (*domain.ProblemVote, error) {
	const q = `
		SELECT id, user_id, problem_id, created_at
		FROM problem_votes
		WHERE user_id = $1 AND problem_id = $2`

	v := &domain.ProblemVote{}
	err := r.db.QueryRowContext(ctx, q, userID, problemID).Scan(
		&v.ID, &v.UserID, &v.ProblemID, &v.CreatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("voteRepo.FindProblemVote: %w", err)
	}
	return v, nil
}

// CreateProblemVote inserts a new vote.
func (r *VoteRepo) CreateProblemVote(ctx context.Context, v *domain.ProblemVote) error {
	const q = `
		INSERT INTO problem_votes (id, user_id, problem_id)
		VALUES ($1, $2, $3)
		RETURNING id, created_at`

	if v.ID == uuid.Nil {
		v.ID = uuid.New()
	}
	return r.db.QueryRowContext(ctx, q, v.ID, v.UserID, v.ProblemID).
		Scan(&v.ID, &v.CreatedAt)
}

// DeleteProblemVote removes the vote for the given user+problem pair.
func (r *VoteRepo) DeleteProblemVote(ctx context.Context, userID, problemID uuid.UUID) error {
	const q = `DELETE FROM problem_votes WHERE user_id = $1 AND problem_id = $2`
	_, err := r.db.ExecContext(ctx, q, userID, problemID)
	return err
}

// HasUserVotedProblems returns a map of problemID → true for every problem
// the user has voted on, among the given problemIDs slice.
func (r *VoteRepo) HasUserVotedProblems(ctx context.Context, userID uuid.UUID, problemIDs []uuid.UUID) (map[uuid.UUID]bool, error) {
	result := make(map[uuid.UUID]bool, len(problemIDs))
	if len(problemIDs) == 0 {
		return result, nil
	}

	// Build $2,$3,... placeholders for the IN clause
	args := make([]interface{}, 0, len(problemIDs)+1)
	args = append(args, userID)
	placeholders := ""
	for i, id := range problemIDs {
		args = append(args, id)
		if i > 0 {
			placeholders += ","
		}
		placeholders += fmt.Sprintf("$%d", i+2)
	}

	q := fmt.Sprintf(`
		SELECT problem_id FROM problem_votes
		WHERE user_id = $1 AND problem_id IN (%s)`, placeholders)

	rows, err := r.db.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, fmt.Errorf("voteRepo.HasUserVotedProblems: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		result[id] = true
	}
	return result, rows.Err()
}
