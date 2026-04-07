package middleware

import (
	"net/http"
	"strings"
)

// CORS dynamically allows requests from any origin listed in allowedOrigins
// (comma-separated). It reflects the matched origin back so credentials work.
func CORS(allowedOrigins string) func(http.Handler) http.Handler {
	// Build a set of normalised allowed origins
	origins := map[string]bool{}
	for o := range strings.SplitSeq(allowedOrigins, ",") {
		trimmed := strings.TrimSpace(strings.TrimRight(o, "/"))
		if trimmed != "" {
			origins[trimmed] = true
		}
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			reqOrigin := r.Header.Get("Origin")

			if origins[reqOrigin] {
				// Echo back the matched origin (required when credentials: true)
				w.Header().Set("Access-Control-Allow-Origin", reqOrigin)
				w.Header().Set("Access-Control-Allow-Credentials", "true")
			}
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Vary", "Origin")

			// Respond to preflight immediately
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
