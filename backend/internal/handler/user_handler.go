package handler

import (
	"net/http"

	"github.com/RohitSadawarte79/solvinghub-backend/internal/middleware"
	"github.com/RohitSadawarte79/solvinghub-backend/internal/service"
	"github.com/google/uuid"
)

// UserHandler handles HTTP requests for users.
type UserHandler struct {
	svc *service.UserService
}

// NewUserHandler constructs a UserHandler.
func NewUserHandler(svc *service.UserService) *UserHandler {
	return &UserHandler{svc: svc}
}

// GetByID handles GET /api/v1/users/{id}
func (h *UserHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respond(w, http.StatusBadRequest, map[string]string{"error": "invalid user ID"})
		return
	}

	u, err := h.svc.GetProfileByID(r.Context(), id)
	if err != nil {
		respondError(w, err)
		return
	}

	respond(w, http.StatusOK, u)
}

// userUpdateRequest is the JSON body for PUT /api/v1/users/{id}.
type userUpdateRequest struct {
	DisplayName string `json:"displayName"`
	PhotoURL    string `json:"photoURL"`
}

// Update handles PUT /api/v1/users/{id} (requires auth, owner only)
func (h *UserHandler) Update(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())

	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respond(w, http.StatusBadRequest, map[string]string{"error": "invalid user ID"})
		return
	}

	var req userUpdateRequest
	if err := decode(r, &req); err != nil {
		respond(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}

	userID, _ := uuid.Parse(claims.UserID)
	if err := h.svc.Update(r.Context(), id, userID, req.DisplayName, req.PhotoURL); err != nil {
		respondError(w, err)
		return
	}

	respond(w, http.StatusOK, map[string]string{"message": "profile updated"})
}
