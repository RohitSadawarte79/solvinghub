package main

import (
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"

	"github.com/RohitSadawarte79/solvinghub-backend/internal/config"
	"github.com/RohitSadawarte79/solvinghub-backend/internal/handler"
	"github.com/RohitSadawarte79/solvinghub-backend/internal/infrastructure/postgres"
	"github.com/RohitSadawarte79/solvinghub-backend/internal/logging"
	"github.com/RohitSadawarte79/solvinghub-backend/internal/router"
	"github.com/RohitSadawarte79/solvinghub-backend/internal/service"
)

func main() {
	// ── Config ────────────────────────────────────────────────────────────
	cfg := config.Load()

	// ── Logging ───────────────────────────────────────────────────────────
	env := os.Getenv("GO_ENV")
	if env == "" {
		env = "development"
	}
	logging.InitLogger(env)
	logging.LogInfo("Starting SolvingHub API",
		slog.String("version", "1.0.0"),
		slog.String("port", cfg.Port),
		slog.String("environment", env),
	)

	// ── Database ──────────────────────────────────────────────────────────
	db, err := postgres.New(cfg.DBDSN)
	if err != nil {
		logging.LogError(err, "failed to connect to database")
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer db.Close()
	logging.LogInfo("database connection established")

	// ── Repositories (Infrastructure Layer) ───────────────────────────────
	userRepo := postgres.NewUserRepo(db)
	problemRepo := postgres.NewProblemRepo(db)
	commentRepo := postgres.NewCommentRepo(db)
	voteRepo := postgres.NewVoteRepo(db)
	solutionRepo := postgres.NewSolutionRepo(db)
	userRankRepo := postgres.NewUserRankRepo(db)

	// ── Services (Business Logic Layer) ───────────────────────────────────
	authSvc := service.NewAuthService(userRepo, userRankRepo,
		cfg.GoogleClientID, cfg.GoogleClientSecret,
		cfg.GoogleRedirectURL, cfg.JWTSecret, cfg.FrontendURL,
	)
	problemSvc := service.NewProblemService(problemRepo)
	commentSvc := service.NewCommentService(commentRepo, problemRepo)
	voteSvc := service.NewVoteService(voteRepo, problemRepo)
	solutionSvc := service.NewSolutionService(solutionRepo, problemRepo, userRankRepo)
	userSvc := service.NewUserService(userRepo)

	// ── Handlers (HTTP Adapter Layer) ─────────────────────────────────────
	authHandler := handler.NewAuthHandler(authSvc, cfg.FrontendURL)
	problemHandler := handler.NewProblemHandler(problemSvc, voteSvc)
	commentHandler := handler.NewCommentHandler(commentSvc)
	voteHandler := handler.NewVoteHandler(voteSvc)
	solutionHandler := handler.NewSolutionHandler(solutionSvc, problemSvc)
	userHandler := handler.NewUserHandler(userSvc)
	healthHandler := handler.NewHealthHandler(db)

	// ── Router ────────────────────────────────────────────────────────────
	h := router.New(authHandler, problemHandler, commentHandler, voteHandler, solutionHandler, userHandler, healthHandler, authSvc, cfg.FrontendURL)

	// ── Server ────────────────────────────────────────────────────────────
	addr := fmt.Sprintf("%s", cfg.Port)
	logging.LogInfo("SolvingHub API listening", slog.String("address", addr))
	if err := http.ListenAndServe(addr, h); err != nil {
		logging.LogError(err, "server error")
		log.Fatalf("server error: %v", err)
	}
}
