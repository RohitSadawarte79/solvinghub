package config

import (
	"fmt"
	"os"
)

// AppConfig holds all configuration loaded from environment variables.
type AppConfig struct {
	// Server
	Port string

	// Database
	DBDSN string

	// Google OAuth
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string

	// JWT
	JWTSecret string

	// CORS
	FrontendURL string
}

// Load reads required environment variables and returns an AppConfig.
// Missing required vars cause a panic to fail fast at startup.
func Load() *AppConfig {
	cfg := &AppConfig{
		Port:               "0.0.0.0:" + getEnv("PORT", "8080"),
		DBDSN:              mustGetEnv("DB_DSN"),
		GoogleClientID:     mustGetEnv("GOOGLE_CLIENT_ID"),
		GoogleClientSecret: mustGetEnv("GOOGLE_CLIENT_SECRET"),
		GoogleRedirectURL:  getEnv("GOOGLE_REDIRECT_URL", "https://solvinghub.vercel.app/api/v1/auth/google/callback"),
		JWTSecret:          mustGetEnv("JWT_SECRET"),
		FrontendURL:        getEnv("FRONTEND_URL", "https://solvinghub.vercel.app"),
	}
	return cfg
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func mustGetEnv(key string) string {
	val := os.Getenv(key)
	if val == "" {
		panic(fmt.Sprintf("required environment variable %q is not set", key))
	}
	return val
}
