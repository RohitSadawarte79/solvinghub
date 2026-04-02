package middleware

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"reflect"
	"strings"
)

// ValidationError represents a validation error with field details
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// ValidationResult contains all validation errors
type ValidationResult struct {
	Errors []ValidationError `json:"errors"`
}

// HasErrors returns true if there are validation errors
func (vr *ValidationResult) HasErrors() bool {
	return len(vr.Errors) > 0
}

// AddError adds a validation error
func (vr *ValidationResult) AddError(field, message string) {
	vr.Errors = append(vr.Errors, ValidationError{
		Field:   field,
		Message: message,
	})
}

// Validator interface for types that can validate themselves
type Validator interface {
	Validate() *ValidationResult
}

// ValidateJSON validates JSON request body against a struct
func ValidateJSON(dst interface{}) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Method == "GET" || r.Method == "DELETE" {
				next.ServeHTTP(w, r)
				return
			}

			contentType := r.Header.Get("Content-Type")
			if !strings.Contains(contentType, "application/json") {
				http.Error(w, `{"error":"Content-Type must be application/json"}`, http.StatusBadRequest)
				return
			}

			body, err := io.ReadAll(io.LimitReader(r.Body, 1048576)) // 1MB limit
			if err != nil {
				http.Error(w, `{"error":"Failed to read request body"}`, http.StatusBadRequest)
				return
			}
			defer r.Body.Close()

			if err := json.Unmarshal(body, dst); err != nil {
				http.Error(w, `{"error":"Invalid JSON format"}`, http.StatusBadRequest)
				return
			}

			// Check if the struct implements Validator interface
			if validator, ok := dst.(Validator); ok {
				result := validator.Validate()
				if result.HasErrors() {
					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusBadRequest)
					json.NewEncoder(w).Encode(result)
					return
				}
			}

			next.ServeHTTP(w, r)
		})
	}
}

// ValidateRequired checks for required fields in a struct
func ValidateRequired(obj interface{}, requiredFields ...string) *ValidationResult {
	result := &ValidationResult{}
	val := reflect.ValueOf(obj)
	
	if val.Kind() == reflect.Ptr {
		val = val.Elem()
	}
	
	if val.Kind() != reflect.Struct {
		result.AddError("object", "must be a struct")
		return result
	}
	
	for _, field := range requiredFields {
		fieldVal := val.FieldByName(field)
		if !fieldVal.IsValid() {
			result.AddError(field, "field does not exist")
			continue
		}
		
		if isZero(fieldVal) {
			result.AddError(field, "is required")
		}
	}
	
	return result
}

// ValidateStringLength validates string field length
func ValidateStringLength(obj interface{}, field string, min, max int) *ValidationResult {
	result := &ValidationResult{}
	val := reflect.ValueOf(obj)
	
	if val.Kind() == reflect.Ptr {
		val = val.Elem()
	}
	
	fieldVal := val.FieldByName(field)
	if !fieldVal.IsValid() {
		result.AddError(field, "field does not exist")
		return result
	}
	
	if fieldVal.Kind() != reflect.String {
		result.AddError(field, "must be a string")
		return result
	}
	
	str := fieldVal.String()
	if len(str) < min {
		result.AddError(field, fmt.Sprintf("must be at least %d characters", min))
	}
	
	if max > 0 && len(str) > max {
		result.AddError(field, fmt.Sprintf("must be at most %d characters", max))
	}
	
	return result
}

// ValidateEnum validates that a field value is in the allowed values
func ValidateEnum(obj interface{}, field string, allowedValues ...string) *ValidationResult {
	result := &ValidationResult{}
	val := reflect.ValueOf(obj)
	
	if val.Kind() == reflect.Ptr {
		val = val.Elem()
	}
	
	fieldVal := val.FieldByName(field)
	if !fieldVal.IsValid() {
		result.AddError(field, "field does not exist")
		return result
	}
	
	if fieldVal.Kind() != reflect.String {
		result.AddError(field, "must be a string")
		return result
	}
	
	str := fieldVal.String()
	for _, allowed := range allowedValues {
		if str == allowed {
			return result // Valid
		}
	}
	
	result.AddError(field, fmt.Sprintf("must be one of: %s", strings.Join(allowedValues, ", ")))
	return result
}

// isZero checks if a value is its zero value
func isZero(v reflect.Value) bool {
	switch v.Kind() {
	case reflect.String:
		return v.String() == ""
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		return v.Int() == 0
	case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
		return v.Uint() == 0
	case reflect.Float32, reflect.Float64:
		return v.Float() == 0
	case reflect.Bool:
		return !v.Bool()
	case reflect.Slice, reflect.Array, reflect.Map:
		return v.Len() == 0
	case reflect.Ptr, reflect.Interface:
		return v.IsNil()
	default:
		return false
	}
}

// MaxBodySize limits the size of request bodies
func MaxBodySize(maxBytes int64) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			r.Body = http.MaxBytesReader(w, r.Body, maxBytes)
			next.ServeHTTP(w, r)
		})
	}
}
