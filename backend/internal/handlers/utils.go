package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
)

// RespondJSON writes a JSON response
func RespondJSON(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

// RespondError writes an error response
func RespondError(w http.ResponseWriter, message string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}

// GetUserIDFromRequest extracts user ID from request headers
func GetUserIDFromRequest(r *http.Request) int {
	userIDStr := r.Header.Get("X-User-ID")
	userID, _ := strconv.Atoi(userIDStr)
	return userID
}

// GetUserRoleFromRequest extracts user role from request headers
func GetUserRoleFromRequest(r *http.Request) string {
	return r.Header.Get("X-User-Role")
}