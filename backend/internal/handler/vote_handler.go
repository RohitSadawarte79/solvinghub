package handler

import (
	"net/http"

	"github.com/RohitSadawarte79/solvinghub-backend/internal/middleware"
	"github.com/RohitSadawarte79/solvinghub-backend/internal/service"
	"github.com/google/uuid"
)

// VoteHandler handles vote toggle requests.
type VoteHandler struct {
	svc *service.VoteService
}

// NewVoteHandler constructs a VoteHandler.
func NewVoteHandler(svc *service.VoteService) *VoteHandler {
	return &VoteHandler{svc: svc}
}

// ToggleProblemVote handles POST /api/v1/problems/{id}/vote (requires auth)
func (h *VoteHandler) ToggleProblemVote(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	problemID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respond(w, http.StatusBadRequest, map[string]string{"error": "invalid problem ID"})
		return
	}

	userID, _ := uuid.Parse(claims.UserID)
	hasVoted, err := h.svc.ToggleProblemVote(r.Context(), userID, problemID)
	if err != nil {
		respondError(w, err)
		return
	}

	respond(w, http.StatusOK, map[string]bool{"voted": hasVoted})
}
