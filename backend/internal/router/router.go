package router

import (
	"net/http"

	"github.com/RohitSadawarte79/solvinghub-backend/internal/docs"
	"github.com/RohitSadawarte79/solvinghub-backend/internal/handler"
	"github.com/RohitSadawarte79/solvinghub-backend/internal/middleware"
	"github.com/RohitSadawarte79/solvinghub-backend/internal/service"
)

// New builds and returns the application router.
// It registers all routes and wraps them with the global middleware chain.
func New(
	authHandler *handler.AuthHandler,
	problemHandler *handler.ProblemHandler,
	commentHandler *handler.CommentHandler,
	voteHandler *handler.VoteHandler,
	solutionHandler *handler.SolutionHandler,
	userHandler *handler.UserHandler,
	healthHandler *handler.HealthHandler,
	authSvc *service.AuthService,
	frontendURL string,
) http.Handler {
	mux := http.NewServeMux()

	// ── Auth ──────────────────────────────────────────────────────────────
	mux.HandleFunc("GET /api/v1/auth/google", authHandler.GoogleLogin)
	mux.HandleFunc("GET /api/v1/auth/google/callback", authHandler.GoogleCallback)
	mux.HandleFunc("POST /api/v1/auth/logout", authHandler.Logout)

	// ── Health Checks ─────────────────────────────────────────────────────
	mux.HandleFunc("GET /health", healthHandler.HealthCheck)
	mux.HandleFunc("GET /health/live", healthHandler.LivenessProbe)
	mux.HandleFunc("GET /health/ready", healthHandler.ReadinessProbe)

	// ── API Documentation ───────────────────────────────────────────────
	mux.HandleFunc("GET /docs", docs.APIDocHandler)
	mux.HandleFunc("GET /api/docs", docs.APIDocHandler)

	// ── Users (public read) ────────────────────────────────────────────────
	mux.HandleFunc("GET /api/v1/users/{id}", userHandler.GetByID)

	// ── Users (authenticated edit) ─────────────────────────────────────────
	authMW := middleware.Auth(authSvc)
	mux.Handle("PUT /api/v1/users/{id}",
		authMW(http.HandlerFunc(userHandler.Update)))

	// ── Problems (public reads) ────────────────────────────────────────────
	mux.HandleFunc("GET /api/v1/problems", problemHandler.List)
	optAuthMW := middleware.OptionalAuth(authSvc)
	mux.Handle("GET /api/v1/problems/{id}", optAuthMW(http.HandlerFunc(problemHandler.GetByID)))

	// ── Problems (authenticated writes) ───────────────────────────────────
	mux.Handle("POST /api/v1/problems",
		authMW(http.HandlerFunc(problemHandler.Create)))
	mux.Handle("PUT /api/v1/problems/{id}",
		authMW(http.HandlerFunc(problemHandler.Update)))
	mux.Handle("DELETE /api/v1/problems/{id}",
		authMW(http.HandlerFunc(problemHandler.Delete)))

	// ── My Problems ────────────────────────────────────────────────────────
	mux.Handle("GET /api/v1/me/problems",
		authMW(http.HandlerFunc(problemHandler.MyProblems)))

	// ── Comments (public read, auth write) ────────────────────────────────
	mux.HandleFunc("GET /api/v1/problems/{id}/comments", commentHandler.ListByProblem)
	mux.Handle("POST /api/v1/problems/{id}/comments",
		authMW(http.HandlerFunc(commentHandler.AddComment)))
	mux.Handle("DELETE /api/v1/comments/{id}",
		authMW(http.HandlerFunc(commentHandler.DeleteComment)))

	// ── Replies ───────────────────────────────────────────────────────────
	mux.Handle("POST /api/v1/comments/{id}/replies",
		authMW(http.HandlerFunc(commentHandler.AddReply)))

	// ── Votes ─────────────────────────────────────────────────────────────
	mux.Handle("POST /api/v1/problems/{id}/vote",
		authMW(http.HandlerFunc(voteHandler.ToggleProblemVote)))

	// ── Solutions ──────────────────────────────────────────────────────────
	// Public: Check if user can submit solution
	mux.Handle("GET /api/v1/problems/{id}/can-solve",
		middleware.OptionalAuth(authSvc)(http.HandlerFunc(solutionHandler.CheckAccess)))

	// Auth required: Submit, list, update, delete solutions
	mux.Handle("POST /api/v1/problems/{id}/solutions",
		authMW(http.HandlerFunc(solutionHandler.Create)))
	mux.Handle("GET /api/v1/problems/{id}/solutions",
		middleware.OptionalAuth(authSvc)(http.HandlerFunc(solutionHandler.ListByProblem)))

	mux.Handle("GET /api/v1/solutions/{id}",
		middleware.OptionalAuth(authSvc)(http.HandlerFunc(solutionHandler.GetByID)))
	mux.Handle("PUT /api/v1/solutions/{id}",
		authMW(http.HandlerFunc(solutionHandler.Update)))
	mux.Handle("DELETE /api/v1/solutions/{id}",
		authMW(http.HandlerFunc(solutionHandler.Delete)))

	// Solution actions (problem owner only)
	mux.Handle("POST /api/v1/solutions/{id}/accept",
		authMW(http.HandlerFunc(solutionHandler.Accept)))
	mux.Handle("POST /api/v1/solutions/{id}/recommend",
		authMW(http.HandlerFunc(solutionHandler.Recommend)))

	// Solution voting (authenticated users)
	mux.Handle("POST /api/v1/solutions/{id}/vote",
		authMW(http.HandlerFunc(solutionHandler.ToggleVote)))

	// ── User Rank ─────────────────────────────────────────────────────────
	mux.Handle("GET /api/v1/me/rank",
		authMW(http.HandlerFunc(solutionHandler.GetUserRank)))

	// ── Global middleware chain (outermost = first to execute) ────────────
	return middleware.Recovery(
		middleware.Logger(
			middleware.CORS(frontendURL)(mux),
		),
	)
}
