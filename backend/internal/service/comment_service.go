package service

import (
	"context"
	"fmt"

	"github.com/RohitSadawarte79/solvinghub-backend/internal/domain"
	"github.com/google/uuid"
)

// CommentService contains business logic for comments and replies.
type CommentService struct {
	comments domain.CommentRepository
	problems domain.ProblemRepository
}

// NewCommentService constructs a CommentService.
func NewCommentService(comments domain.CommentRepository, problems domain.ProblemRepository) *CommentService {
	return &CommentService{comments: comments, problems: problems}
}

// ListWithReplies returns all comments for a problem with their replies embedded.
func (s *CommentService) ListWithReplies(ctx context.Context, problemID uuid.UUID) ([]domain.Comment, [][]domain.Reply, error) {
	comments, err := s.comments.ListByProblemID(ctx, problemID)
	if err != nil {
		return nil, nil, err
	}

	repliesPerComment := make([][]domain.Reply, len(comments))
	for i, c := range comments {
		replies, err := s.comments.ListRepliesByCommentID(ctx, c.ID)
		if err != nil {
			return nil, nil, fmt.Errorf("commentService: list replies for %s: %w", c.ID, err)
		}
		repliesPerComment[i] = replies
	}
	return comments, repliesPerComment, nil
}

// AddComment creates a new comment and increments the problem's comment count.
func (s *CommentService) AddComment(ctx context.Context, c *domain.Comment) error {
	if c.Body == "" {
		return fmt.Errorf("%w: comment body is required", domain.ErrInvalidInput)
	}
	if err := s.comments.Create(ctx, c); err != nil {
		return err
	}
	// Increment problem comment count atomically
	return s.problems.IncrementComments(ctx, c.ProblemID, +1)
}

// DeleteComment removes a comment and its replies. Only the author may delete.
// Also decrements the problem's comment count.
func (s *CommentService) DeleteComment(ctx context.Context, commentID, requestingUserID uuid.UUID) error {
	c, err := s.comments.FindByID(ctx, commentID)
	if err != nil {
		return err
	}
	if c.AuthorID != requestingUserID {
		return domain.ErrForbidden
	}

	// Cascade: delete replies first, then comment
	if err := s.comments.DeleteRepliesByCommentID(ctx, commentID); err != nil {
		return fmt.Errorf("commentService: delete replies: %w", err)
	}
	if err := s.comments.Delete(ctx, commentID); err != nil {
		return err
	}

	// Decrement problem comment count
	return s.problems.IncrementComments(ctx, c.ProblemID, -1)
}

// AddReply creates a new reply to an existing comment.
func (s *CommentService) AddReply(ctx context.Context, r *domain.Reply) error {
	if r.Body == "" {
		return fmt.Errorf("%w: reply body is required", domain.ErrInvalidInput)
	}
	// Verify parent comment exists
	if _, err := s.comments.FindByID(ctx, r.CommentID); err != nil {
		return err
	}
	return s.comments.CreateReply(ctx, r)
}
