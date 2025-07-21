package auth

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/protest-tracker/internal/models"
	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	jwtSecret string
}

func NewService(jwtSecret string) *Service {
	return &Service{
		jwtSecret: jwtSecret,
	}
}

// HashPassword hashes a password using bcrypt
func (s *Service) HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

// CheckPassword checks if the provided password matches the hash
func (s *Service) CheckPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// GenerateToken generates a JWT token for a user
func (s *Service) GenerateToken(userID int, role string) (string, error) {
	claims := &models.Claims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}
