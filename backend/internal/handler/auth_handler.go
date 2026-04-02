package handler

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"net/http"
)

// AuthServiceInterface defines the methods required for authentication operations
type AuthServiceInterface interface {
	AuthURL(state string) string
	HandleCallback(ctx context.Context, code string) (string, error)
	// ValidateJWT is not strictly required by the AuthHandler itself right now, but helps mock
}

// AuthHandler handles the Google OAuth flow.
type AuthHandler struct {
	authSvc     AuthServiceInterface
	frontendURL string
}

// NewAuthHandler constructs an AuthHandler.
func NewAuthHandler(authSvc AuthServiceInterface, frontendURL string) *AuthHandler {
	return &AuthHandler{authSvc: authSvc, frontendURL: frontendURL}
}

// GoogleLogin redirects the user to Google's consent page.
// GET /api/v1/auth/google
func (h *AuthHandler) GoogleLogin(w http.ResponseWriter, r *http.Request) {
	state := randomState()
	// In production: store state in a short-lived cookie or Redis for CSRF validation
	http.Redirect(w, r, h.authSvc.AuthURL(state), http.StatusTemporaryRedirect)
}

// GoogleCallback handles the OAuth callback and redirects to frontend
// for token retrieval via POST. Uses state parameter for CSRF protection.
// GET /api/v1/auth/google/callback
func (h *AuthHandler) GoogleCallback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	state := r.URL.Query().Get("state")

	if code == "" {
		http.Error(w, "missing OAuth code", http.StatusBadRequest)
		return
	}

	if state == "" {
		http.Error(w, "missing state parameter", http.StatusBadRequest)
		return
	}

	// Exchange code for JWT
	jwt, err := h.authSvc.HandleCallback(r.Context(), code)
	if err != nil {
		http.Error(w, "authentication failed", http.StatusInternalServerError)
		return
	}

	// Pass JWT as query parameter to frontend callback page
	// The frontend expects the token in the URL to store it in localStorage
	redirectURL := h.frontendURL + "/auth/callback?state=" + state + "&token=" + jwt

	// Also set JWT in HTTP-only cookie for API requests
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    jwt,
		Path:     "/",
		MaxAge:   7 * 24 * 60 * 60, // 7 days
		Secure:   r.TLS != nil,     // HTTPS only in production
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})

	http.Redirect(w, r, redirectURL, http.StatusTemporaryRedirect)
}

// Logout clears the authentication cookie
// POST /api/v1/auth/logout
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	// Clear the auth cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1, // Delete cookie
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message":"logged out successfully"}`))
}

// randomState generates a URL-safe random state string for CSRF protection.
func randomState() string {
	b := make([]byte, 16)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}
