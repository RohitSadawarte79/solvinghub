package service

import (
	"context"
	"fmt"
	"time"

	"github.com/RohitSadawarte79/solvinghub-backend/internal/domain"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	googleoauth "google.golang.org/api/oauth2/v2"
	"google.golang.org/api/option"
)

// Claims is the payload embedded in every JWT issued by the server.
type Claims struct {
	UserID      string `json:"uid"`
	Email       string `json:"email"`
	DisplayName string `json:"name"`
	PhotoURL    string `json:"picture"`
	Rank        string `json:"rank"`   // User's solving rank (F, E, D, C, B, A, S)
	Points      int    `json:"points"` // User's total points
	jwt.RegisteredClaims
}

// AuthService handles Google OAuth and JWT issuance/validation.
type AuthService struct {
	userRepo    domain.UserRepository
	rankRepo    domain.UserRankRepository
	oauthCfg    *oauth2.Config
	jwtSecret   []byte
	frontendURL string
}

// NewAuthService constructs an AuthService.
func NewAuthService(
	userRepo domain.UserRepository,
	rankRepo domain.UserRankRepository,
	clientID, clientSecret, redirectURL, jwtSecret, frontendURL string,
) *AuthService {
	oauthCfg := &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  redirectURL,
		Scopes:       []string{"openid", "email", "profile"},
		Endpoint:     google.Endpoint,
	}
	return &AuthService{
		userRepo:    userRepo,
		rankRepo:    rankRepo,
		oauthCfg:    oauthCfg,
		jwtSecret:   []byte(jwtSecret),
		frontendURL: frontendURL,
	}
}

// AuthURL returns the Google OAuth consent URL. State should be a random nonce.
func (s *AuthService) AuthURL(state string) string {
	return s.oauthCfg.AuthCodeURL(state, oauth2.AccessTypeOnline)
}

// HandleCallback exchanges the OAuth code for a Google user profile,
// upserts the user in the database, and issues a JWT.
// Returns the signed JWT string.
func (s *AuthService) HandleCallback(ctx context.Context, code string) (string, error) {
	token, err := s.oauthCfg.Exchange(ctx, code)
	if err != nil {
		return "", fmt.Errorf("authService: OAuth exchange: %w", err)
	}

	// Fetch the Google user profile using the access token
	httpClient := s.oauthCfg.Client(ctx, token)
	svc, err := googleoauth.NewService(ctx, option.WithHTTPClient(httpClient))
	if err != nil {
		return "", fmt.Errorf("authService: create OAuth2 service: %w", err)
	}
	info, err := svc.Userinfo.Get().Do()
	if err != nil {
		return "", fmt.Errorf("authService: get userinfo: %w", err)
	}

	// Upsert into users table
	u := &domain.User{
		ID:          uuid.New(),
		GoogleID:    info.Id,
		Email:       info.Email,
		DisplayName: info.Name,
		PhotoURL:    info.Picture,
	}
	if err := s.userRepo.Upsert(ctx, u); err != nil {
		return "", fmt.Errorf("authService: upsert user: %w", err)
	}

	// Initialize rank profile (Rank F, 0 points) for new users
	if s.rankRepo != nil {
		if _, err := s.rankRepo.Get(ctx, u.ID); err != nil {
			// No rank profile yet — create one with default Rank F
			defaultProfile := &domain.UserRankProfile{
				UserID:      u.ID,
				CurrentRank: domain.RankF,
				Points:      0,
			}
			if err := s.rankRepo.Upsert(ctx, defaultProfile); err != nil {
				return "", fmt.Errorf("authService: init rank profile: %w", err)
			}
		}
	}

	// Issue JWT
	return s.issueJWT(ctx, u)
}

// issueJWT creates and signs a JWT containing the user's profile claims.
func (s *AuthService) issueJWT(ctx context.Context, u *domain.User) (string, error) {
	rank := "F"
	points := 0

	// Try to get user's rank profile
	if s.rankRepo != nil {
		if profile, err := s.rankRepo.Get(ctx, u.ID); err == nil {
			rank = string(profile.CurrentRank)
			points = profile.Points
		}
	}

	claims := Claims{
		UserID:      u.ID.String(),
		Email:       u.Email,
		DisplayName: u.DisplayName,
		PhotoURL:    u.PhotoURL,
		Rank:        rank,
		Points:      points,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   u.ID.String(),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
		},
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return tok.SignedString(s.jwtSecret)
}

// ValidateJWT parses and validates the token, returning the Claims on success.
func (s *AuthService) ValidateJWT(tokenStr string) (*Claims, error) {
	tok, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return s.jwtSecret, nil
	})
	if err != nil {
		return nil, domain.ErrUnauthorized
	}
	claims, ok := tok.Claims.(*Claims)
	if !ok || !tok.Valid {
		return nil, domain.ErrUnauthorized
	}
	return claims, nil
}
