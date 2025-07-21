package services

import (
	"database/sql"
	"errors"

	"github.com/protest-tracker/internal/auth"
	"github.com/protest-tracker/internal/models"
	"github.com/protest-tracker/internal/repository"
)

type AuthService struct {
	userRepo *repository.UserRepository
	auth     *auth.Service
}

func NewAuthService(userRepo *repository.UserRepository, authService *auth.Service) *AuthService {
	return &AuthService{
		userRepo: userRepo,
		auth:     authService,
	}
}

// Login authenticates a user and returns a JWT token
func (s *AuthService) Login(email, password string) (string, error) {
	user, err := s.userRepo.GetByEmail(email)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", errors.New("invalid credentials")
		}
		return "", err
	}

	if !s.auth.CheckPassword(password, user.Password) {
		return "", errors.New("invalid credentials")
	}

	token, err := s.auth.GenerateToken(user.ID, user.Role)
	if err != nil {
		return "", err
	}

	return token, nil
}

// Register creates a new user account
func (s *AuthService) Register(email, password, role string) (*models.User, error) {
	// Check if user already exists
	existingUser, err := s.userRepo.GetByEmail(email)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if existingUser != nil {
		return nil, errors.New("user already exists")
	}

	// Hash password
	hashedPassword, err := s.auth.HashPassword(password)
	if err != nil {
		return nil, err
	}

	// Create user
	user := &models.User{
		Email:    email,
		Password: hashedPassword,
		Role:     role,
	}

	err = s.userRepo.Create(user)
	if err != nil {
		return nil, err
	}

	// Clear password before returning
	user.Password = ""
	return user, nil
}
