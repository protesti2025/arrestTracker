package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/protest-tracker/internal/models"
	"github.com/protest-tracker/internal/services"
)

type AuthHandler struct {
	authService *services.AuthService
}

func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
	}
}

// Login handles user authentication
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.Password == "" {
		RespondError(w, "Email and password are required", http.StatusBadRequest)
		return
	}

	token, err := h.authService.Login(req.Email, req.Password)
	if err != nil {
		RespondError(w, err.Error(), http.StatusUnauthorized)
		return
	}

	RespondJSON(w, models.LoginResponse{Token: token})
}

// Register handles user registration
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Role     string `json:"role"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.Password == "" {
		RespondError(w, "Email and password are required", http.StatusBadRequest)
		return
	}

	if req.Role == "" {
		req.Role = "spotter" // Default role
	}

	if req.Role != "spotter" && req.Role != "advocate" {
		RespondError(w, "Invalid role. Must be 'spotter' or 'advocate'", http.StatusBadRequest)
		return
	}

	user, err := h.authService.Register(req.Email, req.Password, req.Role)
	if err != nil {
		RespondError(w, err.Error(), http.StatusBadRequest)
		return
	}

	RespondJSON(w, user)
}
