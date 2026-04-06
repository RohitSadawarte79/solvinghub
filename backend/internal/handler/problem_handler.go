package handler

import (
	"context"
	"net/http"

	"github.com/RohitSadawarte79/solvinghub-backend/internal/domain"
	"github.com/RohitSadawarte79/solvinghub-backend/internal/middleware"
	"github.com/RohitSadawarte79/solvinghub-backend/internal/service"
	"github.com/google/uuid"
)

// ProblemHandler handles HTTP requests for problems.
type ProblemHandler struct {
	svc     *service.ProblemService
	voteSvc *service.VoteService
}

// NewProblemHandler constructs a ProblemHandler.
func NewProblemHandler(svc *service.ProblemService, voteSvc *service.VoteService) *ProblemHandler {
	return &ProblemHandler{svc: svc, voteSvc: voteSvc}
}

// problemRequest is the JSON body for create/update.
type problemRequest struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Category    string   `json:"category"`
	Tags        []string `json:"tags"`
	Impacts     []string `json:"impacts"`
	Challenges  []string `json:"challenges"`
}

// List handles GET /api/v1/problems?sort=votes&dir=desc
func (h *ProblemHandler) List(w http.ResponseWriter, r *http.Request) {
	params := domain.ListParams{
		SortBy:  r.URL.Query().Get("sort"),
		SortDir: r.URL.Query().Get("dir"),
	}
	problems, err := h.svc.List(r.Context(), params)
	if err != nil {
		respondError(w, err)
		return
	}
	respond(w, http.StatusOK, problems)
}

// Create handles POST /api/v1/problems (requires auth)
func (h *ProblemHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())

	var req problemRequest
	if err := decode(r, &req); err != nil {
		respond(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}

	userID, _ := uuid.Parse(claims.UserID)
	p := &domain.Problem{
		Title:         req.Title,
		Description:   req.Description,
		Category:      req.Category,
		Tags:          req.Tags,
		Impacts:       req.Impacts,
		Challenges:    req.Challenges,
		SubmittedByID: userID,
		SubmittedBy:   claims.DisplayName,
	}

	if p.Tags == nil {
		p.Tags = []string{}
	}
	if p.Impacts == nil {
		p.Impacts = []string{}
	}
	if p.Challenges == nil {
		p.Challenges = []string{}
	}

	if err := h.svc.Create(r.Context(), p); err != nil {
		respondError(w, err)
		return
	}
	respond(w, http.StatusCreated, p)
}

// GetByID handles GET /api/v1/problems/{id}
func (h *ProblemHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respond(w, http.StatusBadRequest, map[string]string{"error": "invalid problem ID"})
		return
	}

	// Start activity tracking asynchronously if the user is authenticated via OptionalAuth
	if claims := middleware.ClaimsFromContext(r.Context()); claims != nil {
		if userID, err := uuid.Parse(claims.UserID); err == nil {
			go func() {
				// We don't block the API return waiting for database inserts
				_ = h.svc.TrackView(context.Background(), userID, id)
			}()
		}
	}

	p, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		respondError(w, err)
		return
	}
	respond(w, http.StatusOK, p)
}

// Update handles PUT /api/v1/problems/{id} (requires auth, owner only)
func (h *ProblemHandler) Update(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respond(w, http.StatusBadRequest, map[string]string{"error": "invalid problem ID"})
		return
	}

	var req problemRequest
	if err := decode(r, &req); err != nil {
		respond(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}

	userID, _ := uuid.Parse(claims.UserID)
	patch := &domain.Problem{
		Title: req.Title, Description: req.Description, Category: req.Category,
		Tags: req.Tags, Impacts: req.Impacts, Challenges: req.Challenges,
	}

	if patch.Tags == nil {
		patch.Tags = []string{}
	}
	if patch.Impacts == nil {
		patch.Impacts = []string{}
	}
	if patch.Challenges == nil {
		patch.Challenges = []string{}
	}
	if err := h.svc.Update(r.Context(), id, userID, patch); err != nil {
		respondError(w, err)
		return
	}
	respond(w, http.StatusOK, map[string]string{"message": "problem updated"})
}

// Delete handles DELETE /api/v1/problems/{id} (requires auth, owner only)
func (h *ProblemHandler) Delete(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respond(w, http.StatusBadRequest, map[string]string{"error": "invalid problem ID"})
		return
	}

	userID, _ := uuid.Parse(claims.UserID)
	if err := h.svc.Delete(r.Context(), id, userID); err != nil {
		respondError(w, err)
		return
	}
	respond(w, http.StatusOK, map[string]string{"message": "problem deleted"})
}

// MyProblems handles GET /api/v1/me/problems (requires auth)
func (h *ProblemHandler) MyProblems(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID, _ := uuid.Parse(claims.UserID)

	problems, err := h.svc.ListByUser(r.Context(), userID)
	if err != nil {
		respondError(w, err)
		return
	}
	respond(w, http.StatusOK, problems)
}
