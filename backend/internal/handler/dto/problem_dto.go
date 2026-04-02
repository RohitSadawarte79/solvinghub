package dto

import (
	"fmt"

	"github.com/RohitSadawarte79/solvinghub-backend/internal/middleware"
)

// CreateProblemRequest represents the request body for creating a problem
type CreateProblemRequest struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Category    string   `json:"category"`
	Tags        []string `json:"tags"`
	Impacts     []string `json:"impacts"`
	Challenges  []string `json:"challenges"`
	Difficulty  string   `json:"difficulty"`
}

// Validate implements Validator interface
func (cpr *CreateProblemRequest) Validate() *middleware.ValidationResult {
	result := &middleware.ValidationResult{}

	// Required fields
	required := middleware.ValidateRequired(cpr, "title", "description", "category", "difficulty")
	result.Errors = append(result.Errors, required.Errors...)

	// Title validation
	titleValidation := middleware.ValidateStringLength(cpr, "title", 5, 200)
	result.Errors = append(result.Errors, titleValidation.Errors...)

	// Description validation
	descValidation := middleware.ValidateStringLength(cpr, "description", 20, 2000)
	result.Errors = append(result.Errors, descValidation.Errors...)

	// Category validation
	categoryValidation := middleware.ValidateEnum(cpr, "category",
		"Environment", "Technology", "Healthcare", "Education",
		"Infrastructure", "Social", "Other")
	result.Errors = append(result.Errors, categoryValidation.Errors...)

	// Difficulty validation
	difficultyValidation := middleware.ValidateEnum(cpr, "difficulty",
		"beginner", "easy", "medium", "hard", "expert")
	result.Errors = append(result.Errors, difficultyValidation.Errors...)

	// Tags validation (optional but if present, must be valid)
	if len(cpr.Tags) > 0 {
		if len(cpr.Tags) > 10 {
			result.AddError("tags", "cannot have more than 10 tags")
		}
		for i, tag := range cpr.Tags {
			if len(tag) > 50 {
				result.AddError(fmt.Sprintf("tags[%d]", i), "tag too long (max 50 characters)")
			}
		}
	}

	return result
}

// UpdateProblemRequest represents the request body for updating a problem
type UpdateProblemRequest struct {
	Title       *string  `json:"title,omitempty"`
	Description *string  `json:"description,omitempty"`
	Category    *string  `json:"category,omitempty"`
	Tags        []string `json:"tags,omitempty"`
	Impacts     []string `json:"impacts,omitempty"`
	Challenges  []string `json:"challenges,omitempty"`
	Difficulty  *string  `json:"difficulty,omitempty"`
}

// Validate implements Validator interface
func (upr *UpdateProblemRequest) Validate() *middleware.ValidationResult {
	result := &middleware.ValidationResult{}

	// Title validation if provided
	if upr.Title != nil {
		titleValidation := middleware.ValidateStringLength(upr, "title", 5, 200)
		result.Errors = append(result.Errors, titleValidation.Errors...)
	}

	// Description validation if provided
	if upr.Description != nil {
		descValidation := middleware.ValidateStringLength(upr, "description", 20, 2000)
		result.Errors = append(result.Errors, descValidation.Errors...)
	}

	// Category validation if provided
	if upr.Category != nil {
		categoryValidation := middleware.ValidateEnum(upr, "category",
			"Environment", "Technology", "Healthcare", "Education",
			"Infrastructure", "Social", "Other")
		result.Errors = append(result.Errors, categoryValidation.Errors...)
	}

	// Difficulty validation if provided
	if upr.Difficulty != nil {
		difficultyValidation := middleware.ValidateEnum(upr, "difficulty",
			"beginner", "easy", "medium", "hard", "expert")
		result.Errors = append(result.Errors, difficultyValidation.Errors...)
	}

	// Tags validation if provided
	if len(upr.Tags) > 0 {
		if len(upr.Tags) > 10 {
			result.AddError("tags", "cannot have more than 10 tags")
		}
		for i, tag := range upr.Tags {
			if len(tag) > 50 {
				result.AddError(fmt.Sprintf("tags[%d]", i), "tag too long (max 50 characters)")
			}
		}
	}

	return result
}
