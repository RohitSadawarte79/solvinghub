package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/RohitSadawarte79/solvinghub-backend/internal/domain"
)

// respond writes a JSON body and status code.
func respond(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(body)
}

// respondError maps domain errors to HTTP status codes and writes a JSON error response.
func respondError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrNotFound):
		respond(w, http.StatusNotFound, map[string]string{"error": err.Error()})
	case errors.Is(err, domain.ErrForbidden):
		respond(w, http.StatusForbidden, map[string]string{"error": err.Error()})
	case errors.Is(err, domain.ErrUnauthorized):
		respond(w, http.StatusUnauthorized, map[string]string{"error": err.Error()})
	case errors.Is(err, domain.ErrInvalidInput):
		respond(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
	case errors.Is(err, domain.ErrConflict):
		respond(w, http.StatusConflict, map[string]string{"error": err.Error()})
	default:
		// Print the real error to the container logs so we can debug it
		println("INTERNAL ERROR:", err.Error())
		respond(w, http.StatusInternalServerError, map[string]string{"error": "internal server error"})
	}
}

// decode reads and decodes the JSON request body into dest.
func decode(r *http.Request, dest any) error {
	return json.NewDecoder(r.Body).Decode(dest)
}
