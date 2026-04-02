package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// Rank represents user skill levels in the solving system
type Rank string

const (
	RankF Rank = "F" // Novice
	RankE Rank = "E" // Apprentice
	RankD Rank = "D" // Contributor
	RankC Rank = "C" // Specialist
	RankB Rank = "B" // Expert
	RankA Rank = "A" // Master
	RankS Rank = "S" // Legend
)

// UserRankProfile represents a user's ranking and achievement profile
type UserRankProfile struct {
	UserID            uuid.UUID
	CurrentRank       Rank
	Points            int
	ProblemsSolved    int
	SolutionsAccepted int
	TotalContributions int
	CreatedAt         time.Time
	UpdatedAt         time.Time
}

// RankHistory represents a user's rank progression history
type RankHistory struct {
	UserID    uuid.UUID
	FromRank  Rank
	ToRank    Rank
	ChangedAt time.Time
	Reason    string
}

// UserRankRepository defines the persistence contract for user rankings
type UserRankRepository interface {
	// Get returns the user's rank profile
	Get(ctx context.Context, userID uuid.UUID) (*UserRankProfile, error)
	
	// Upsert creates or updates a user's rank profile
	Upsert(ctx context.Context, profile *UserRankProfile) error
	
	// AddPoints adds points to a user's profile and returns the new rank
	AddPoints(ctx context.Context, userID uuid.UUID, points int) (Rank, error)
	
	// GetLeaderboard returns top users by points (with pagination)
	GetLeaderboard(ctx context.Context, limit, offset int) ([]*UserRankProfile, error)
	
	// GetRankDistribution returns the count of users at each rank level
	GetRankDistribution(ctx context.Context) (map[Rank]int, error)
}

// RankThresholds defines the points required for each rank level
var RankThresholds = map[Rank]int{
	RankF: 0,    // Starting rank
	RankE: 100,  // Apprentice
	RankD: 300,  // Contributor
	RankC: 600,  // Specialist
	RankB: 1000, // Expert
	RankA: 2000, // Master
	RankS: 5000, // Legend
}

// CalculateRank determines the rank based on total points
func CalculateRank(points int) Rank {
	for rank, threshold := range RankThresholds {
		if points >= threshold {
			return rank
		}
	}
	return RankF // Default to F rank
}

// GetNextRank returns the next rank after the current one
func GetNextRank(currentRank Rank) (Rank, int) {
	rankOrder := []Rank{RankF, RankE, RankD, RankC, RankB, RankA, RankS}
	
	for i, rank := range rankOrder {
		if rank == currentRank && i < len(rankOrder)-1 {
			nextRank := rankOrder[i+1]
			return nextRank, RankThresholds[nextRank]
		}
	}
	
	return currentRank, 0 // Already at highest rank
}

// IsValidRank checks if a rank value is valid
func IsValidRank(rank string) bool {
	switch Rank(rank) {
	case RankF, RankE, RankD, RankC, RankB, RankA, RankS:
		return true
	default:
		return false
	}
}
