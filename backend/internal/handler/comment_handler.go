package handler

import (
	"net/http"

	"github.com/RohitSadawarte79/solvinghub-backend/internal/domain"
	"github.com/RohitSadawarte79/solvinghub-backend/internal/middleware"
	"github.com/RohitSadawarte79/solvinghub-backend/internal/service"
	"github.com/google/uuid"
)

// CommentHandler handles HTTP requests for comments and replies.
type CommentHandler struct {
	svc *service.CommentService
}

// NewCommentHandler constructs a CommentHandler.
func NewCommentHandler(svc *service.CommentService) *CommentHandler {
	return &CommentHandler{svc: svc}
}

// commentWithReplies is the JSON response shape for a comment listing.
type commentWithReplies struct {
	domain.Comment
	Replies []domain.Reply `json:"replies"`
}

// ListByProblem handles GET /api/v1/problems/{id}/comments
func (h *CommentHandler) ListByProblem(w http.ResponseWriter, r *http.Request) {
	problemID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respond(w, http.StatusBadRequest, map[string]string{"error": "invalid problem ID"})
		return
	}

	comments, repliesPerComment, err := h.svc.ListWithReplies(r.Context(), problemID)
	if err != nil {
		respondError(w, err)
		return
	}

	result := make([]commentWithReplies, len(comments))
	for i, c := range comments {
		result[i] = commentWithReplies{Comment: c, Replies: repliesPerComment[i]}
		if result[i].Replies == nil {
			result[i].Replies = []domain.Reply{} // return [] not null in JSON
		}
	}
	respond(w, http.StatusOK, result)
}

// AddComment handles POST /api/v1/problems/{id}/comments (requires auth)
func (h *CommentHandler) AddComment(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	problemID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respond(w, http.StatusBadRequest, map[string]string{"error": "invalid problem ID"})
		return
	}

	var body struct {
		Text string `json:"text"`
	}
	if err := decode(r, &body); err != nil {
		respond(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}

	authorID, _ := uuid.Parse(claims.UserID)
	c := &domain.Comment{
		ProblemID:      problemID,
		AuthorID:       authorID,
		AuthorName:     claims.DisplayName,
		AuthorPhotoURL: claims.PhotoURL,
		Body:           body.Text,
	}
	if err := h.svc.AddComment(r.Context(), c); err != nil {
		respondError(w, err)
		return
	}
	respond(w, http.StatusCreated, c)
}

// DeleteComment handles DELETE /api/v1/comments/{id} (requires auth, author only)
func (h *CommentHandler) DeleteComment(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	commentID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respond(w, http.StatusBadRequest, map[string]string{"error": "invalid comment ID"})
		return
	}

	userID, _ := uuid.Parse(claims.UserID)
	if err := h.svc.DeleteComment(r.Context(), commentID, userID); err != nil {
		respondError(w, err)
		return
	}
	respond(w, http.StatusOK, map[string]string{"message": "comment deleted"})
}

// AddReply handles POST /api/v1/comments/{id}/replies (requires auth)
func (h *CommentHandler) AddReply(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	commentID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respond(w, http.StatusBadRequest, map[string]string{"error": "invalid comment ID"})
		return
	}

	var body struct {
		Text      string `json:"text"`
		ProblemID string `json:"problem_id"`
	}
	if err := decode(r, &body); err != nil {
		respond(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}

	authorID, _ := uuid.Parse(claims.UserID)
	problemID, _ := uuid.Parse(body.ProblemID)

	rep := &domain.Reply{
		CommentID:      commentID,
		ProblemID:      problemID,
		AuthorID:       authorID,
		AuthorName:     claims.DisplayName,
		AuthorPhotoURL: claims.PhotoURL,
		Body:           body.Text,
	}
	if err := h.svc.AddReply(r.Context(), rep); err != nil {
		respondError(w, err)
		return
	}
	respond(w, http.StatusCreated, rep)
}
