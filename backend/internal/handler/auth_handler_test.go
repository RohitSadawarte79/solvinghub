package handler

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/RohitSadawarte79/solvinghub-backend/internal/service"
)

// MockAuthService for testing
type MockAuthService struct {
	authURL string
}

func (m *MockAuthService) AuthURL(state string) string {
	return "https://accounts.google.com/oauth/authorize?state=" + state
}

func (m *MockAuthService) HandleCallback(ctx context.Context, code string) (string, error) {
	return "mock.jwt.token", nil
}

func (m *MockAuthService) ValidateJWT(token string) (*service.Claims, error) {
	return &service.Claims{
		UserID:      "test-user-id",
		Email:       "test@example.com",
		DisplayName: "Test User",
		Rank:        "F",
		Points:      0,
	}, nil
}

func TestGoogleLogin(t *testing.T) {
	mockAuth := &MockAuthService{}
	handler := NewAuthHandler(mockAuth, "http://localhost:3000")

	req := httptest.NewRequest("GET", "/api/v1/auth/google", nil)
	w := httptest.NewRecorder()

	handler.GoogleLogin(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusTemporaryRedirect {
		t.Errorf("Expected status %d, got %d", http.StatusTemporaryRedirect, resp.StatusCode)
	}

	location := resp.Header.Get("Location")
	if location == "" {
		t.Error("Expected Location header to be set")
	}
}

func TestLogout(t *testing.T) {
	mockAuth := &MockAuthService{}
	handler := NewAuthHandler(mockAuth, "http://localhost:3000")

	req := httptest.NewRequest("POST", "/api/v1/auth/logout", nil)
	w := httptest.NewRecorder()

	handler.Logout(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, resp.StatusCode)
	}

	// Check that cookie is cleared
	cookies := resp.Cookies()
	var authCookie *http.Cookie
	for _, c := range cookies {
		if c.Name == "auth_token" {
			authCookie = c
			break
		}
	}

	if authCookie == nil {
		t.Error("Expected auth_token cookie to be set")
	} else if authCookie.MaxAge > 0 {
		t.Error("Expected auth_token cookie to have negative MaxAge (deleted)")
	}
}
