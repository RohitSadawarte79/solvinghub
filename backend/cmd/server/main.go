package main

import (
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"

	"github.com/getsentry/sentry-go"
	sentrynegroni "github.com/getsentry/sentry-go/negroni"
	"github.com/urfave/negroni/v3"

	"github.com/RohitSadawarte79/solvinghub-backend/internal/config"
	"github.com/RohitSadawarte79/solvinghub-backend/internal/handler"
	"github.com/RohitSadawarte79/solvinghub-backend/internal/infrastructure/postgres"
	"github.com/RohitSadawarte79/solvinghub-backend/internal/logging"
	"github.com/RohitSadawarte79/solvinghub-backend/internal/router"
	"github.com/RohitSadawarte79/solvinghub-backend/internal/service"
)

func main() {
	// ── Sentry ────────────────────────────────────────────────────────────
	if err := sentry.Init(sentry.ClientOptions{
		Dsn:              "https://46634147c4d4ad4fa76db45bd4ffd758@o4511174033866752.ingest.de.sentry.io/4511174036095056",
		EnableTracing:    true,
		TracesSampleRate: 1.0,
		EnableLogs:       true,
	}); err != nil {
		fmt.Printf("Sentry initialization failed: %v\n", err)
	}

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

	sentry.CaptureMessage("Sentry is working!")

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

	// ── Sentry middleware (outermost layer) ───────────────────────────────
	// Repanic: true because our existing Recovery middleware handles the 500 response.
	app := negroni.New(
		sentrynegroni.New(sentrynegroni.Options{
			Repanic: true,
		}),
	)
	app.UseHandler(h)

	// ── Server ────────────────────────────────────────────────────────────
	addr := fmt.Sprintf("%s", cfg.Port)
	logging.LogInfo("SolvingHub API listening", slog.String("address", addr))
	if err := http.ListenAndServe(addr, app); err != nil {
		logging.LogError(err, "server error")
		log.Fatalf("server error: %v", err)
	}
}
