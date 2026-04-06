package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/RohitSadawarte79/solvinghub-backend/internal/domain"
	"github.com/google/uuid"
)

// CommentRepo implements domain.CommentRepository using PostgreSQL.
type CommentRepo struct {
	db *sql.DB
}

// NewCommentRepo constructs a CommentRepo.
func NewCommentRepo(db *sql.DB) *CommentRepo {
	return &CommentRepo{db: db}
}

// ListByProblemID returns all comments for a problem, newest first.
func (r *CommentRepo) ListByProblemID(ctx context.Context, problemID uuid.UUID) ([]domain.Comment, error) {
	const q = `
		SELECT c.id, c.problem_id, c.author_id, c.author_name, c.author_photo_url, c.body, c.votes_count, c.created_at,
		       COALESCE(ur.current_rank, 'F') as author_rank, COALESCE(ur.points, 0) as author_points
		FROM comments c
		LEFT JOIN user_ranks ur ON c.author_id = ur.user_id
		WHERE c.problem_id = $1
		ORDER BY c.created_at DESC`

	rows, err := r.db.QueryContext(ctx, q, problemID)
	if err != nil {
		return nil, fmt.Errorf("commentRepo.ListByProblemID: %w", err)
	}
	defer rows.Close()

	var comments []domain.Comment
	for rows.Next() {
		var c domain.Comment
		if err := rows.Scan(
			&c.ID, &c.ProblemID, &c.AuthorID, &c.AuthorName, &c.AuthorPhotoURL,
			&c.Body, &c.VotesCount, &c.CreatedAt, &c.AuthorRank, &c.AuthorPoints,
		); err != nil {
			return nil, fmt.Errorf("commentRepo scan: %w", err)
		}
		comments = append(comments, c)
	}
	return comments, rows.Err()
}

// FindByID returns a comment or domain.ErrNotFound.
func (r *CommentRepo) FindByID(ctx context.Context, id uuid.UUID) (*domain.Comment, error) {
	const q = `
		SELECT c.id, c.problem_id, c.author_id, c.author_name, c.author_photo_url, c.body, c.votes_count, c.created_at,
		       COALESCE(ur.current_rank, 'F') as author_rank, COALESCE(ur.points, 0) as author_points
		FROM comments c
		LEFT JOIN user_ranks ur ON c.author_id = ur.user_id
		WHERE c.id = $1`

	c := &domain.Comment{}
	err := r.db.QueryRowContext(ctx, q, id).Scan(
		&c.ID, &c.ProblemID, &c.AuthorID, &c.AuthorName, &c.AuthorPhotoURL,
		&c.Body, &c.VotesCount, &c.CreatedAt, &c.AuthorRank, &c.AuthorPoints,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("commentRepo.FindByID: %w", err)
	}
	return c, nil
}

// Create inserts a new comment.
func (r *CommentRepo) Create(ctx context.Context, c *domain.Comment) error {
	const q = `
		INSERT INTO comments (id, problem_id, author_id, author_name, author_photo_url, body)
		VALUES ($1,$2,$3,$4,$5,$6)
		RETURNING id, created_at`

	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return r.db.QueryRowContext(ctx, q,
		c.ID, c.ProblemID, c.AuthorID, c.AuthorName, c.AuthorPhotoURL, c.Body,
	).Scan(&c.ID, &c.CreatedAt)
}

// Delete removes a comment by ID.
func (r *CommentRepo) Delete(ctx context.Context, id uuid.UUID) error {
	const q = `DELETE FROM comments WHERE id = $1`
	res, err := r.db.ExecContext(ctx, q, id)
	if err != nil {
		return fmt.Errorf("commentRepo.Delete: %w", err)
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return domain.ErrNotFound
	}
	return nil
}

// DeleteRepliesByCommentID removes all replies for a given comment.
func (r *CommentRepo) DeleteRepliesByCommentID(ctx context.Context, commentID uuid.UUID) error {
	const q = `DELETE FROM replies WHERE comment_id = $1`
	_, err := r.db.ExecContext(ctx, q, commentID)
	return err
}

// CreateReply persists a new reply.
func (r *CommentRepo) CreateReply(ctx context.Context, rep *domain.Reply) error {
	const q = `
		INSERT INTO replies (id, comment_id, problem_id, author_id, author_name, author_photo_url, body)
		VALUES ($1,$2,$3,$4,$5,$6,$7)
		RETURNING id, created_at`

	if rep.ID == uuid.Nil {
		rep.ID = uuid.New()
	}
	return r.db.QueryRowContext(ctx, q,
		rep.ID, rep.CommentID, rep.ProblemID, rep.AuthorID, rep.AuthorName, rep.AuthorPhotoURL, rep.Body,
	).Scan(&rep.ID, &rep.CreatedAt)
}

// ListRepliesByCommentID returns replies for a comment, oldest first.
func (r *CommentRepo) ListRepliesByCommentID(ctx context.Context, commentID uuid.UUID) ([]domain.Reply, error) {
	const q = `
		SELECT r.id, r.comment_id, r.problem_id, r.author_id, r.author_name, r.author_photo_url, r.body, r.created_at,
		       COALESCE(ur.current_rank, 'F') as author_rank, COALESCE(ur.points, 0) as author_points
		FROM replies r
		LEFT JOIN user_ranks ur ON r.author_id = ur.user_id
		WHERE r.comment_id = $1
		ORDER BY r.created_at ASC`

	rows, err := r.db.QueryContext(ctx, q, commentID)
	if err != nil {
		return nil, fmt.Errorf("commentRepo.ListReplies: %w", err)
	}
	defer rows.Close()

	var replies []domain.Reply
	for rows.Next() {
		var rep domain.Reply
		if err := rows.Scan(
			&rep.ID, &rep.CommentID, &rep.ProblemID, &rep.AuthorID,
			&rep.AuthorName, &rep.AuthorPhotoURL, &rep.Body, &rep.CreatedAt,
			&rep.AuthorRank, &rep.AuthorPoints,
		); err != nil {
			return nil, fmt.Errorf("commentRepo reply scan: %w", err)
		}
		replies = append(replies, rep)
	}
	return replies, rows.Err()
}
