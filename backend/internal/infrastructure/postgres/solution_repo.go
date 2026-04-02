package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/RohitSadawarte79/solvinghub-backend/internal/domain"
	"github.com/google/uuid"
)

// SolutionRepo implements domain.SolutionRepository using PostgreSQL.
type SolutionRepo struct {
	db *sql.DB
}

// NewSolutionRepo constructs a SolutionRepo.
func NewSolutionRepo(db *sql.DB) *SolutionRepo {
	return &SolutionRepo{db: db}
}

// Create inserts a new solution and populates its ID and timestamps.
func (r *SolutionRepo) Create(ctx context.Context, s *domain.Solution) error {
	const q = `
		INSERT INTO solutions
		  (id, problem_id, author_id, author_name, author_photo_url, author_rank, author_points,
		   title, description, attachments, implementation_approach, resources_needed, estimated_timeline, status)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
		RETURNING id, created_at, updated_at`

	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}

	attachmentsJSON, err := json.Marshal(s.Attachments)
	if err != nil {
		attachmentsJSON = []byte("[]")
	}

	return r.db.QueryRowContext(ctx, q,
		s.ID, s.ProblemID, s.AuthorID, s.AuthorName, s.AuthorPhotoURL,
		s.AuthorRank, s.AuthorPoints, s.Title, s.Description,
		attachmentsJSON, s.ImplementationApproach, s.ResourcesNeeded,
		s.EstimatedTimeline, s.Status,
	).Scan(&s.ID, &s.CreatedAt, &s.UpdatedAt)
}

// FindByID returns a solution or domain.ErrNotFound.
func (r *SolutionRepo) FindByID(ctx context.Context, id uuid.UUID) (*domain.Solution, error) {
	const q = `
		SELECT id, problem_id, author_id, author_name, author_photo_url, author_rank, author_points,
		       title, description, attachments, implementation_approach, resources_needed, 
		       estimated_timeline, status, created_at, updated_at
		FROM solutions
		WHERE id = $1`

	s := &domain.Solution{}
	var attachmentsJSON []byte

	err := r.db.QueryRowContext(ctx, q, id).Scan(
		&s.ID, &s.ProblemID, &s.AuthorID, &s.AuthorName, &s.AuthorPhotoURL,
		&s.AuthorRank, &s.AuthorPoints, &s.Title, &s.Description,
		&attachmentsJSON, &s.ImplementationApproach, &s.ResourcesNeeded,
		&s.EstimatedTimeline, &s.Status, &s.CreatedAt, &s.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("solutionRepo.FindByID: %w", err)
	}

	if err := json.Unmarshal(attachmentsJSON, &s.Attachments); err != nil {
		s.Attachments = []domain.Attachment{}
	}

	return s, nil
}

// FindByProblemID returns all solutions for a problem.
func (r *SolutionRepo) FindByProblemID(ctx context.Context, problemID uuid.UUID) ([]domain.Solution, error) {
	const q = `
		SELECT id, problem_id, author_id, author_name, author_photo_url, author_rank, author_points,
		       title, description, attachments, implementation_approach, resources_needed, 
		       estimated_timeline, status, created_at, updated_at
		FROM solutions
		WHERE problem_id = $1
		ORDER BY created_at DESC`

	rows, err := r.db.QueryContext(ctx, q, problemID)
	if err != nil {
		return nil, fmt.Errorf("solutionRepo.FindByProblemID: %w", err)
	}
	defer rows.Close()

	return scanSolutions(rows)
}

// FindByAuthorID returns all solutions by a user.
func (r *SolutionRepo) FindByAuthorID(ctx context.Context, authorID uuid.UUID) ([]domain.Solution, error) {
	const q = `
		SELECT id, problem_id, author_id, author_name, author_photo_url, author_rank, author_points,
		       title, description, attachments, implementation_approach, resources_needed, 
		       estimated_timeline, status, created_at, updated_at
		FROM solutions
		WHERE author_id = $1
		ORDER BY created_at DESC`

	rows, err := r.db.QueryContext(ctx, q, authorID)
	if err != nil {
		return nil, fmt.Errorf("solutionRepo.FindByAuthorID: %w", err)
	}
	defer rows.Close()

	return scanSolutions(rows)
}

// Update persists changes to an existing solution.
func (r *SolutionRepo) Update(ctx context.Context, s *domain.Solution) error {
	attachmentsJSON, err := json.Marshal(s.Attachments)
	if err != nil {
		attachmentsJSON = []byte("[]")
	}

	const q = `
		UPDATE solutions
		SET title=$1, description=$2, attachments=$3, implementation_approach=$4,
		    resources_needed=$5, estimated_timeline=$6, status=$7, updated_at=NOW()
		WHERE id=$8`

	_, err = r.db.ExecContext(ctx, q,
		s.Title, s.Description, attachmentsJSON, s.ImplementationApproach,
		s.ResourcesNeeded, s.EstimatedTimeline, s.Status, s.ID,
	)
	if err != nil {
		return fmt.Errorf("solutionRepo.Update: %w", err)
	}
	return nil
}

// Delete removes a solution by ID.
func (r *SolutionRepo) Delete(ctx context.Context, id uuid.UUID) error {
	const q = `DELETE FROM solutions WHERE id = $1`
	res, err := r.db.ExecContext(ctx, q, id)
	if err != nil {
		return fmt.Errorf("solutionRepo.Delete: %w", err)
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return domain.ErrNotFound
	}
	return nil
}

// IncrementSolutions atomically increments solution_count on a problem.
func (r *SolutionRepo) IncrementSolutions(ctx context.Context, problemID uuid.UUID, delta int) error {
	const q = `UPDATE problems SET solution_count = solution_count + $1 WHERE id = $2`
	_, err := r.db.ExecContext(ctx, q, delta, problemID)
	return err
}

// IncrementVotes atomically increments votes_count on a solution.
func (r *SolutionRepo) IncrementVotes(ctx context.Context, solutionID uuid.UUID, delta int) error {
	const q = `UPDATE solutions SET votes_count = votes_count + $1 WHERE id = $2`
	_, err := r.db.ExecContext(ctx, q, delta, solutionID)
	return err
}

// FindSolutionVote returns nil if the user has voted, or domain.ErrNotFound if not.
func (r *SolutionRepo) FindSolutionVote(ctx context.Context, userID, solutionID uuid.UUID) error {
	const q = `SELECT 1 FROM solution_votes WHERE user_id = $1 AND solution_id = $2`
	var exists int
	err := r.db.QueryRowContext(ctx, q, userID, solutionID).Scan(&exists)
	if errors.Is(err, sql.ErrNoRows) {
		return domain.ErrNotFound
	}
	if err != nil {
		return fmt.Errorf("solutionRepo.FindSolutionVote: %w", err)
	}
	return nil
}

// CreateSolutionVote records a new vote.
func (r *SolutionRepo) CreateSolutionVote(ctx context.Context, userID, solutionID uuid.UUID) error {
	const q = `
		INSERT INTO solution_votes (id, user_id, solution_id)
		VALUES ($1, $2, $3)
		ON CONFLICT DO NOTHING`

	_, err := r.db.ExecContext(ctx, q, uuid.New(), userID, solutionID)
	return err
}

// DeleteSolutionVote removes an existing vote.
func (r *SolutionRepo) DeleteSolutionVote(ctx context.Context, userID, solutionID uuid.UUID) error {
	const q = `DELETE FROM solution_votes WHERE user_id = $1 AND solution_id = $2`
	_, err := r.db.ExecContext(ctx, q, userID, solutionID)
	return err
}

// HasUserVotedSolutions returns a map of solutionID → true for every solution
// the user has voted on, among the given solutionIDs slice.
func (r *SolutionRepo) HasUserVotedSolutions(ctx context.Context, userID uuid.UUID, solutionIDs []uuid.UUID) (map[uuid.UUID]bool, error) {
	result := make(map[uuid.UUID]bool, len(solutionIDs))
	if len(solutionIDs) == 0 {
		return result, nil
	}

	// Build $2,$3,... placeholders for the IN clause
	args := make([]interface{}, 0, len(solutionIDs)+1)
	args = append(args, userID)
	placeholders := ""
	for i, id := range solutionIDs {
		args = append(args, id)
		if i > 0 {
			placeholders += ","
		}
		placeholders += fmt.Sprintf("$%d", i+2)
	}

	q := fmt.Sprintf(`
		SELECT solution_id FROM solution_votes
		WHERE user_id = $1 AND solution_id IN (%s)`, placeholders)

	rows, err := r.db.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, fmt.Errorf("solutionRepo.HasUserVotedSolutions: %w", err)
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

// scanSolutions scans *sql.Rows into a slice of domain.Solution.
func scanSolutions(rows *sql.Rows) ([]domain.Solution, error) {
	var solutions []domain.Solution
	for rows.Next() {
		var s domain.Solution
		var attachmentsJSON []byte
		if err := rows.Scan(
			&s.ID, &s.ProblemID, &s.AuthorID, &s.AuthorName, &s.AuthorPhotoURL,
			&s.AuthorRank, &s.AuthorPoints, &s.Title, &s.Description,
			&attachmentsJSON, &s.ImplementationApproach, &s.ResourcesNeeded,
			&s.EstimatedTimeline, &s.Status, &s.VotesCount, &s.CreatedAt, &s.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scanSolutions: %w", err)
		}
		if err := json.Unmarshal(attachmentsJSON, &s.Attachments); err != nil {
			s.Attachments = []domain.Attachment{}
		}
		solutions = append(solutions, s)
	}
	return solutions, rows.Err()
}