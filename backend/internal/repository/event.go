package repository

import (
	"database/sql"

	"github.com/protest-tracker/internal/models"
)

type EventRepository struct {
	db *sql.DB
}

func NewEventRepository(db *sql.DB) *EventRepository {
	return &EventRepository{db: db}
}

// GetAll retrieves all arrest events
func (r *EventRepository) GetAll() ([]models.ArrestEvent, error) {
	rows, err := r.db.Query(`
		SELECT id, time, latitude, longitude, notes, created_by 
		FROM arrest_events 
		ORDER BY time DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []models.ArrestEvent
	for rows.Next() {
		var event models.ArrestEvent
		var notes sql.NullString

		err := rows.Scan(&event.ID, &event.Time, &event.Latitude, &event.Longitude,
			&notes, &event.CreatedBy)
		if err != nil {
			return nil, err
		}

		event.Notes = notes.String
		events = append(events, event)
	}

	return events, nil
}

// GetByID retrieves an event by ID
func (r *EventRepository) GetByID(id int) (*models.ArrestEvent, error) {
	var event models.ArrestEvent
	var notes sql.NullString

	err := r.db.QueryRow(`
		SELECT id, time, latitude, longitude, notes, created_by 
		FROM arrest_events 
		WHERE id = $1
	`, id).Scan(&event.ID, &event.Time, &event.Latitude, &event.Longitude,
		&notes, &event.CreatedBy)

	if err != nil {
		return nil, err
	}

	event.Notes = notes.String

	return &event, nil
}

// Create creates a new arrest event
func (r *EventRepository) Create(event *models.ArrestEvent) (int, error) {
	var eventID int
	err := r.db.QueryRow(`
		INSERT INTO arrest_events (time, latitude, longitude, notes, created_by) 
		VALUES ($1, $2, $3, $4, $5) 
		RETURNING id
	`, event.Time, event.Latitude, event.Longitude, event.Notes, event.CreatedBy).Scan(&eventID)

	return eventID, err
}

// Update updates an existing event
func (r *EventRepository) Update(event *models.ArrestEvent) error {
	_, err := r.db.Exec(`
		UPDATE arrest_events 
		SET time = $1, latitude = $2, longitude = $3, notes = $4
		WHERE id = $5
	`, event.Time, event.Latitude, event.Longitude, event.Notes, event.ID)

	return err
}

// Delete deletes an event
func (r *EventRepository) Delete(id int) error {
	_, err := r.db.Exec("DELETE FROM arrest_events WHERE id = $1", id)
	return err
}
