package handler

import (
	"context"
	"net/http"

	"github.com/RohitSadawarte79/solvinghub-backend/internal/domain"
	"github.com/RohitSadawarte79/solvinghub-backend/internal/middleware"
	"github.com/RohitSadawarte79/solvinghub-backend/internal/service"
	"github.com/google/uuid"
)

// SolutionHandler handles HTTP requests for solutions.
type SolutionHandler struct {
	svc        *service.SolutionService
	problemSvc *service.ProblemService
}

// NewSolutionHandler constructs a SolutionHandler.
func NewSolutionHandler(svc *service.SolutionService, problemSvc *service.ProblemService) *SolutionHandler {
	return &SolutionHandler{svc: svc, problemSvc: problemSvc}
}

// solutionRequest is the JSON body for create/update.
type solutionRequest struct {
	ProblemID             string                `json:"problemId"`
	Title                 string                `json:"title"`
	Description           string                `json:"description"`
	Attachments           []domain.Attachment   `json:"attachments"`
	ImplementationApproach string                `json:"implementationApproach"`
	ResourcesNeeded       string                `json:"resourcesNeeded"`
	EstimatedTimeline     string                `json:"estimatedTimeline"`
}

// Create handles POST /api/v1/problems/{id}/solutions (requires auth)
func (h *SolutionHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())

	problemID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respond(w, http.StatusBadRequest, map[string]string{"error": "invalid problem ID"})
		return
	}

	userID, _ := uuid.Parse(claims.UserID)

	// Check rank-based access
	canSubmit, reason, err := h.svc.CanSubmitSolution(r.Context(), userID, problemID)
	if err != nil {
		respondError(w, err)
		return
	}
	if !canSubmit {
		respond(w, http.StatusForbidden, map[string]string{"error": reason})
		return
	}

	var req solutionRequest
	if err := decode(r, &req); err != nil {
		respond(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}

	sol := &domain.Solution{
		ProblemID:              problemID,
		AuthorID:               userID,
		AuthorName:             claims.DisplayName,
		AuthorPhotoURL:         claims.PhotoURL,
		AuthorRank:             domain.Rank(claims.Rank),
		AuthorPoints:           claims.Points,
		Title:                  req.Title,
		Description:            req.Description,
		Attachments:            req.Attachments,
		ImplementationApproach: req.ImplementationApproach,
		ResourcesNeeded:        req.ResourcesNeeded,
		EstimatedTimeline:      req.EstimatedTimeline,
	}

	if err := h.svc.Create(r.Context(), sol); err != nil {
		respondError(w, err)
		return
	}
	respond(w, http.StatusCreated, sol)
}

// ListByProblem handles GET /api/v1/problems/{id}/solutions
// Returns solutions only to the problem owner
func (h *SolutionHandler) ListByProblem(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	problemID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respond(w, http.StatusBadRequest, map[string]string{"error": "invalid problem ID"})
		return
	}

	// If not authenticated, only public solutions (none yet)
	if claims == nil {
		respond(w, http.StatusOK, []domain.Solution{})
		return
	}

	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		respond(w, http.StatusBadRequest, map[string]string{"error": "invalid user ID"})
		return
	}

	// Check if user is problem owner - if so, return all solutions
	solutions, err := h.svc.GetSolutionsForProblemOwner(r.Context(), problemID, userID)
	if err == domain.ErrForbidden {
		// User is not owner, return only their own solutions
		solutions, err = h.solutionsByAuthor(r.Context(), problemID, userID)
		if err != nil {
			respondError(w, err)
			return
		}
	} else if err != nil {
		respondError(w, err)
		return
	}

	respond(w, http.StatusOK, solutions)
}

func (h *SolutionHandler) solutionsByAuthor(ctx context.Context, problemID, authorID uuid.UUID) ([]domain.Solution, error) {
	all, err := h.svc.GetByProblemID(ctx, problemID)
	if err != nil {
		return nil, err
	}
	var result []domain.Solution
	for _, s := range all {
		if s.AuthorID == authorID {
			result = append(result, s)
		}
	}
	return result, nil
}

// GetByID handles GET /api/v1/solutions/{id}
func (h *SolutionHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respond(w, http.StatusBadRequest, map[string]string{"error": "invalid solution ID"})
		return
	}

	sol, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		respondError(w, err)
		return
	}
	respond(w, http.StatusOK, sol)
}

// Update handles PUT /api/v1/solutions/{id} (requires auth, owner only)
func (h *SolutionHandler) Update(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respond(w, http.StatusBadRequest, map[string]string{"error": "invalid solution ID"})
		return
	}

	var req solutionRequest
	if err := decode(r, &req); err != nil {
		respond(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}

	userID, _ := uuid.Parse(claims.UserID)
	patch := &domain.Solution{
		Title:                req.Title,
		Description:          req.Description,
		Attachments:          req.Attachments,
		ImplementationApproach: req.ImplementationApproach,
		ResourcesNeeded:      req.ResourcesNeeded,
		EstimatedTimeline:    req.EstimatedTimeline,
	}

	if err := h.svc.Update(r.Context(), id, userID, patch); err != nil {
		respondError(w, err)
		return
	}
	respond(w, http.StatusOK, map[string]string{"message": "solution updated"})
}

// Delete handles DELETE /api/v1/solutions/{id} (requires auth, owner only)
func (h *SolutionHandler) Delete(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respond(w, http.StatusBadRequest, map[string]string{"error": "invalid solution ID"})
		return
	}

	userID, _ := uuid.Parse(claims.UserID)
	if err := h.svc.Delete(r.Context(), id, userID); err != nil {
		respondError(w, err)
		return
	}
	respond(w, http.StatusOK, map[string]string{"message": "solution deleted"})
}

// Accept handles POST /api/v1/solutions/{id}/accept (problem owner only)
func (h *SolutionHandler) Accept(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respond(w, http.StatusBadRequest, map[string]string{"error": "invalid solution ID"})
		return
	}

	userID, _ := uuid.Parse(claims.UserID)
	if err := h.svc.AcceptSolution(r.Context(), id, userID); err != nil {
		respondError(w, err)
		return
	}
	respond(w, http.StatusOK, map[string]string{"message": "solution accepted"})
}

// Recommend handles POST /api/v1/solutions/{id}/recommend (problem owner only)
func (h *SolutionHandler) Recommend(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respond(w, http.StatusBadRequest, map[string]string{"error": "invalid solution ID"})
		return
	}

	userID, _ := uuid.Parse(claims.UserID)
	if err := h.svc.RecommendSolution(r.Context(), id, userID); err != nil {
		respondError(w, err)
		return
	}
	respond(w, http.StatusOK, map[string]string{"message": "solution recommended"})
}

// GetUserRank handles GET /api/v1/me/rank (requires auth)
func (h *SolutionHandler) GetUserRank(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	if claims == nil {
		respond(w, http.StatusUnauthorized, map[string]string{"error": "authentication required"})
		return
	}

	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		respond(w, http.StatusBadRequest, map[string]string{"error": "invalid user ID"})
		return
	}

	profile, err := h.svc.GetUserRank(r.Context(), userID)
	if err != nil {
		respondError(w, err)
		return
	}
	respond(w, http.StatusOK, profile)
}

// CheckAccess handles GET /api/v1/problems/{id}/can-solve (requires auth)
// Returns whether the user can submit a solution to this problem
func (h *SolutionHandler) CheckAccess(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	problemID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respond(w, http.StatusBadRequest, map[string]string{"error": "invalid problem ID"})
		return
	}

	// If not authenticated, they can't submit
	if claims == nil {
		respond(w, http.StatusOK, map[string]interface{}{
			"canSubmit": false,
			"reason":    "authentication required",
		})
		return
	}

	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		respond(w, http.StatusBadRequest, map[string]string{"error": "invalid user ID"})
		return
	}
	canSubmit, reason, err := h.svc.CanSubmitSolution(r.Context(), userID, problemID)
	if err != nil {
		respondError(w, err)
		return
	}
	respond(w, http.StatusOK, map[string]interface{}{
		"canSubmit": canSubmit,
		"reason":    reason,
	})
}

// ToggleVote handles POST /api/v1/solutions/{id}/vote (requires auth)
// Toggles the user's vote on a solution
func (h *SolutionHandler) ToggleVote(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	if claims == nil {
		respond(w, http.StatusUnauthorized, map[string]string{"error": "authentication required"})
		return
	}

	solutionID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respond(w, http.StatusBadRequest, map[string]string{"error": "invalid solution ID"})
		return
	}

	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		respond(w, http.StatusBadRequest, map[string]string{"error": "invalid user ID"})
		return
	}

	hasVoted, err := h.svc.ToggleSolutionVote(r.Context(), userID, solutionID)
	if err != nil {
		respondError(w, err)
		return
	}

	respond(w, http.StatusOK, map[string]interface{}{
		"voted": hasVoted,
	})
}