package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/RohitSadawarte79/solvinghub-backend/internal/service"
)

// contextKey is a private type for context keys to avoid collisions.
type contextKey string

const UserClaimsKey contextKey = "userClaims"

// Auth returns a middleware that validates the Bearer JWT in the Authorization header.
// If valid, it injects the *service.Claims into the request context.
// Routes that are public should NOT use this middleware.
func Auth(authSvc *service.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				http.Error(w, `{"error":"authentication required"}`, http.StatusUnauthorized)
				return
			}

			token := strings.TrimPrefix(authHeader, "Bearer ")
			claims, err := authSvc.ValidateJWT(token)
			if err != nil {
				http.Error(w, `{"error":"invalid or expired token"}`, http.StatusUnauthorized)
				return
			}

			// Inject claims into context so handlers can read the caller's identity
			ctx := context.WithValue(r.Context(), UserClaimsKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// OptionalAuth is like Auth but does NOT reject the request if there is no token.
// Handlers can check for nil claims to determine if the user is authenticated.
func OptionalAuth(authSvc *service.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
				token := strings.TrimPrefix(authHeader, "Bearer ")
				if claims, err := authSvc.ValidateJWT(token); err == nil {
					ctx := context.WithValue(r.Context(), UserClaimsKey, claims)
					r = r.WithContext(ctx)
				}
			}
			next.ServeHTTP(w, r)
		})
	}
}

// ClaimsFromContext extracts the typed *service.Claims from the request context.
// Returns nil if no claims are present (unauthenticated request).
func ClaimsFromContext(ctx context.Context) *service.Claims {
	claims, _ := ctx.Value(UserClaimsKey).(*service.Claims)
	return claims
}
