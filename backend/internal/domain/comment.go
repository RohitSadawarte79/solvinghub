package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// Comment is a top-level comment on a Problem.
type Comment struct {
	ID             uuid.UUID `json:"id"`
	ProblemID      uuid.UUID `json:"problemId"`
	AuthorID       uuid.UUID `json:"authorId"`
	AuthorName     string    `json:"authorName"`
	AuthorPhotoURL string    `json:"authorPhotoUrl"`
	AuthorRank     string    `json:"authorRank"` // F, E, D, C, B, A, S
	AuthorPoints   int       `json:"authorPoints"`
	Body           string    `json:"body"`
	VotesCount     int       `json:"votes"`
	CreatedAt      time.Time `json:"createdAt"`
}

// Reply is a nested reply to a Comment (one level of nesting).
type Reply struct {
	ID             uuid.UUID `json:"id"`
	CommentID      uuid.UUID `json:"commentId"`
	ProblemID      uuid.UUID `json:"problemId"`
	AuthorID       uuid.UUID `json:"authorId"`
	AuthorName     string    `json:"authorName"`
	AuthorPhotoURL string    `json:"authorPhotoUrl"`
	AuthorRank     string    `json:"authorRank"` // F, E, D, C, B, A, S
	AuthorPoints   int       `json:"authorPoints"`
	Body           string    `json:"body"`
	CreatedAt      time.Time `json:"createdAt"`
}

// CommentRepository defines persistence operations for comments and their replies.
type CommentRepository interface {
	// ListByProblemID returns all comments for a problem, newest first.
	// Each comment has its replies embedded.
	ListByProblemID(ctx context.Context, problemID uuid.UUID) ([]Comment, error)
	// FindByID returns the comment or ErrNotFound.
	FindByID(ctx context.Context, id uuid.UUID) (*Comment, error)
	// Create persists a new comment and populates c.ID and c.CreatedAt.
	Create(ctx context.Context, c *Comment) error
	// Delete removes a comment by ID. Does NOT cascade — caller must DeleteRepliesByCommentID first.
	Delete(ctx context.Context, id uuid.UUID) error
	// DeleteRepliesByCommentID removes all replies for the given comment.
	DeleteRepliesByCommentID(ctx context.Context, commentID uuid.UUID) error
	// CreateReply persists a new reply.
	CreateReply(ctx context.Context, r *Reply) error
	// ListRepliesByCommentID returns all replies for a comment, oldest first.
	ListRepliesByCommentID(ctx context.Context, commentID uuid.UUID) ([]Reply, error)
}
