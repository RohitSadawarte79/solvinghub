package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/RohitSadawarte79/solvinghub-backend/internal/domain"
	"github.com/google/uuid"
	"github.com/lib/pq"
)

// ProblemRepo implements domain.ProblemRepository using PostgreSQL.
type ProblemRepo struct {
	db *sql.DB
}

// NewProblemRepo constructs a ProblemRepo.
func NewProblemRepo(db *sql.DB) *ProblemRepo {
	return &ProblemRepo{db: db}
}

// Create inserts a new problem and populates p.ID and p.CreatedAt.
func (r *ProblemRepo) Create(ctx context.Context, p *domain.Problem) error {
	const q = `
		INSERT INTO problems
		  (id, title, description, category, tags, impacts, challenges, submitted_by_id, submitted_by)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
		RETURNING id, created_at, updated_at`

	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}

	return r.db.QueryRowContext(ctx, q,
		p.ID, p.Title, p.Description, p.Category,
		pq.Array(p.Tags), pq.Array(p.Impacts), pq.Array(p.Challenges),
		p.SubmittedByID, p.SubmittedBy,
	).Scan(&p.ID, &p.CreatedAt, &p.UpdatedAt)
}

// FindByID returns a problem or domain.ErrNotFound.
func (r *ProblemRepo) FindByID(ctx context.Context, id uuid.UUID) (*domain.Problem, error) {
	const q = `
		SELECT id, title, description, category, tags, impacts, challenges,
		       votes_count, comments_count, solution_count, difficulty, min_rank_required,
		       submitted_by_id, submitted_by, created_at, updated_at
		FROM problems
		WHERE id = $1`

	p := &domain.Problem{}
	err := r.db.QueryRowContext(ctx, q, id).Scan(
		&p.ID, &p.Title, &p.Description, &p.Category,
		pq.Array(&p.Tags), pq.Array(&p.Impacts), pq.Array(&p.Challenges),
		&p.VotesCount, &p.CommentsCount, &p.SolutionCount, &p.Difficulty, &p.MinRankRequired,
		&p.SubmittedByID, &p.SubmittedBy,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("problemRepo.FindByID: %w", err)
	}
	return p, nil
}

// List returns problems ordered by the requested field.
// Allowed sortBy values: "votes_count", "comments_count", "created_at", "title".
func (r *ProblemRepo) List(ctx context.Context, params domain.ListParams) ([]domain.Problem, error) {
	// Whitelist sort columns to prevent SQL injection
	allowedSort := map[string]string{
		"votes":       "votes_count",
		"discussions": "comments_count",
		"timestamp":   "created_at",
		"title":       "title",
	}
	col, ok := allowedSort[params.SortBy]
	if !ok {
		col = "votes_count"
	}
	dir := "DESC"
	if params.SortDir == "asc" {
		dir = "ASC"
	}

	q := fmt.Sprintf(`
		SELECT id, title, description, category, tags, impacts, challenges,
		       votes_count, comments_count, solution_count, difficulty, min_rank_required,
		       submitted_by_id, submitted_by, created_at, updated_at
		FROM problems
		ORDER BY %s %s`, col, dir)

	rows, err := r.db.QueryContext(ctx, q)
	if err != nil {
		return nil, fmt.Errorf("problemRepo.List: %w", err)
	}
	defer rows.Close()

	return scanProblems(rows)
}

// ListByUserID returns problems for the given user, newest first.
func (r *ProblemRepo) ListByUserID(ctx context.Context, userID uuid.UUID) ([]domain.Problem, error) {
	const q = `
		SELECT id, title, description, category, tags, impacts, challenges,
		       votes_count, comments_count, solution_count, difficulty, min_rank_required,
		       submitted_by_id, submitted_by, created_at, updated_at
		FROM problems
		WHERE submitted_by_id = $1
		ORDER BY created_at DESC`

	rows, err := r.db.QueryContext(ctx, q, userID)
	if err != nil {
		return nil, fmt.Errorf("problemRepo.ListByUserID: %w", err)
	}
	defer rows.Close()

	return scanProblems(rows)
}

// Update persists changes to an existing problem.
func (r *ProblemRepo) Update(ctx context.Context, p *domain.Problem) error {
	const q = `
		UPDATE problems
		SET title=$1, description=$2, category=$3, tags=$4, impacts=$5, challenges=$6, updated_at=NOW()
		WHERE id=$7`

	_, err := r.db.ExecContext(ctx, q,
		p.Title, p.Description, p.Category,
		pq.Array(p.Tags), pq.Array(p.Impacts), pq.Array(p.Challenges),
		p.ID,
	)
	if err != nil {
		return fmt.Errorf("problemRepo.Update: %w", err)
	}
	return nil
}

// Delete removes a problem by ID.
func (r *ProblemRepo) Delete(ctx context.Context, id uuid.UUID) error {
	const q = `DELETE FROM problems WHERE id = $1`
	res, err := r.db.ExecContext(ctx, q, id)
	if err != nil {
		return fmt.Errorf("problemRepo.Delete: %w", err)
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return domain.ErrNotFound
	}
	return nil
}

// IncrementVotes atomically adjusts the votes_count by delta.
func (r *ProblemRepo) IncrementVotes(ctx context.Context, id uuid.UUID, delta int) error {
	const q = `UPDATE problems SET votes_count = votes_count + $1 WHERE id = $2`
	_, err := r.db.ExecContext(ctx, q, delta, id)
	return err
}

// IncrementComments atomically adjusts the comments_count by delta.
func (r *ProblemRepo) IncrementComments(ctx context.Context, id uuid.UUID, delta int) error {
	const q = `UPDATE problems SET comments_count = comments_count + $1 WHERE id = $2`
	_, err := r.db.ExecContext(ctx, q, delta, id)
	return err
}

// scanProblems scans a *sql.Rows into a slice of domain.Problem.
func scanProblems(rows *sql.Rows) ([]domain.Problem, error) {
	problems := []domain.Problem{}
	for rows.Next() {
		var p domain.Problem
		if err := rows.Scan(
			&p.ID, &p.Title, &p.Description, &p.Category,
			pq.Array(&p.Tags), pq.Array(&p.Impacts), pq.Array(&p.Challenges),
			&p.VotesCount, &p.CommentsCount, &p.SolutionCount, &p.Difficulty, &p.MinRankRequired,
			&p.SubmittedByID, &p.SubmittedBy,
			&p.CreatedAt, &p.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scanProblems: %w", err)
		}
		problems = append(problems, p)
	}
	return problems, rows.Err()
}
