package logging

import (
	"log/slog"
	"os"
)

var Logger *slog.Logger

// InitLogger initializes the structured logger
func InitLogger(env string) {
	var handler slog.Handler
	
	switch env {
	case "production":
		// JSON handler for production
		handler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
			Level: slog.LevelInfo,
		})
	default:
		// Text handler for development
		handler = slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
			Level: slog.LevelDebug,
		})
	}
	
	Logger = slog.New(handler)
	slog.SetDefault(Logger)
}

// LogRequest logs HTTP request information
func LogRequest(method, path, remoteAddr, userAgent string, statusCode int, duration int64) {
	Logger.Info("HTTP Request",
		slog.String("method", method),
		slog.String("path", path),
		slog.String("remote_addr", remoteAddr),
		slog.String("user_agent", userAgent),
		slog.Int("status_code", statusCode),
		slog.Int64("duration_ms", duration),
	)
}

// LogError logs error with context
func LogError(err error, msg string, args ...any) {
	Logger.Error(msg, append([]any{"error", err}, args...)...)
}

// LogInfo logs informational message
func LogInfo(msg string, args ...any) {
	Logger.Info(msg, args...)
}

// LogWarn logs warning message
func LogWarn(msg string, args ...any) {
	Logger.Warn(msg, args...)
}

// LogDebug logs debug message
func LogDebug(msg string, args ...any) {
	Logger.Debug(msg, args...)
}
