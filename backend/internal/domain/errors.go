package domain

import "errors"

// Sentinel errors — the domain owns these, handlers translate them to HTTP codes.
var (
	ErrNotFound      = errors.New("resource not found")
	ErrForbidden     = errors.New("you do not have permission to perform this action")
	ErrConflict      = errors.New("resource already exists")
	ErrInvalidInput  = errors.New("invalid input")
	ErrUnauthorized  = errors.New("authentication required")
	
	// Business logic specific errors
	ErrUserNotFound      = errors.New("user not found")
	ErrProblemNotFound   = errors.New("problem not found")
	ErrSolutionNotFound  = errors.New("solution not found")
	ErrCommentNotFound   = errors.New("comment not found")
	ErrVoteNotFound      = errors.New("vote not found")
	ErrInvalidRank       = errors.New("invalid user rank")
	ErrInsufficientRank  = errors.New("insufficient rank to access this content")
	ErrSolutionSubmitted = errors.New("solution already submitted for this problem")
	ErrNotProblemOwner   = errors.New("only problem owner can perform this action")
	ErrNotSolutionOwner  = errors.New("only solution owner can perform this action")
	ErrOAuthFailed       = errors.New("OAuth authentication failed")
	ErrInvalidToken      = errors.New("invalid or expired token")
	ErrDatabaseError     = errors.New("database operation failed")
)
