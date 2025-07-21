package repository

import (
	"database/sql"

	"github.com/protest-tracker/internal/models"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

// GetByEmail retrieves a user by email
func (r *UserRepository) GetByEmail(email string) (*models.User, error) {
	var user models.User
	err := r.db.QueryRow("SELECT id, email, password, role FROM users WHERE email = $1", email).
		Scan(&user.ID, &user.Email, &user.Password, &user.Role)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

// Create creates a new user
func (r *UserRepository) Create(user *models.User) error {
	return r.db.QueryRow(
		"INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id",
		user.Email, user.Password, user.Role,
	).Scan(&user.ID)
}

// GetByID retrieves a user by ID
func (r *UserRepository) GetByID(id int) (*models.User, error) {
	var user models.User
	err := r.db.QueryRow("SELECT id, email, password, role FROM users WHERE id = $1", id).
		Scan(&user.ID, &user.Email, &user.Password, &user.Role)

	if err != nil {
		return nil, err
	}

	return &user, nil
}
