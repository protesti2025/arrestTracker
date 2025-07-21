package repository

import (
	"database/sql"

	"github.com/protest-tracker/internal/models"
)

type SubscriptionRepository struct {
	db *sql.DB
}

func NewSubscriptionRepository(db *sql.DB) *SubscriptionRepository {
	return &SubscriptionRepository{db: db}
}

// Subscribe adds a subscription for a user to an event
func (r *SubscriptionRepository) Subscribe(eventID, userID int) error {
	_, err := r.db.Exec(`
		INSERT INTO subscriptions (event_id, user_id) 
		VALUES ($1, $2) 
		ON CONFLICT (event_id, user_id) DO NOTHING
	`, eventID, userID)
	return err
}

// Unsubscribe removes a subscription
func (r *SubscriptionRepository) Unsubscribe(eventID, userID int) error {
	_, err := r.db.Exec(`
		DELETE FROM subscriptions 
		WHERE event_id = $1 AND user_id = $2
	`, eventID, userID)
	return err
}

// GetSubscribersByEventID retrieves all subscribers for an event
func (r *SubscriptionRepository) GetSubscribersByEventID(eventID int) ([]models.User, error) {
	rows, err := r.db.Query(`
		SELECT u.id, u.email, u.role 
		FROM subscriptions s 
		JOIN users u ON s.user_id = u.id 
		WHERE s.event_id = $1
	`, eventID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var user models.User
		err := rows.Scan(&user.ID, &user.Email, &user.Role)
		if err != nil {
			return nil, err
		}
		users = append(users, user)
	}

	return users, nil
}

// IsSubscribed checks if a user is subscribed to an event
func (r *SubscriptionRepository) IsSubscribed(eventID, userID int) (bool, error) {
	var count int
	err := r.db.QueryRow(`
		SELECT COUNT(*) FROM subscriptions 
		WHERE event_id = $1 AND user_id = $2
	`, eventID, userID).Scan(&count)

	if err != nil {
		return false, err
	}

	return count > 0, nil
}

// GetUserSubscriptions retrieves all events a user is subscribed to
func (r *SubscriptionRepository) GetUserSubscriptions(userID int) ([]models.Subscription, error) {
	rows, err := r.db.Query(`
		SELECT id, event_id, user_id 
		FROM subscriptions 
		WHERE user_id = $1
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var subscriptions []models.Subscription
	for rows.Next() {
		var sub models.Subscription
		err := rows.Scan(&sub.ID, &sub.EventID, &sub.UserID)
		if err != nil {
			return nil, err
		}
		subscriptions = append(subscriptions, sub)
	}

	return subscriptions, nil
}
