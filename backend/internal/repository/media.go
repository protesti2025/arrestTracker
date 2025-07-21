package repository

import (
	"database/sql"

	"github.com/protest-tracker/internal/models"
)

type MediaRepository struct {
	db *sql.DB
}

func NewMediaRepository(db *sql.DB) *MediaRepository {
	return &MediaRepository{db: db}
}

// GetByEventID retrieves all media for an event
func (r *MediaRepository) GetByEventID(eventID int) ([]models.Media, error) {
	rows, err := r.db.Query(`
		SELECT id, event_id, file_path, type 
		FROM media 
		WHERE event_id = $1 
		ORDER BY created_at DESC
	`, eventID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var mediaList []models.Media
	for rows.Next() {
		var media models.Media
		err := rows.Scan(&media.ID, &media.EventID, &media.FilePath, &media.Type)
		if err != nil {
			return nil, err
		}
		mediaList = append(mediaList, media)
	}

	return mediaList, nil
}

// Create creates a new media record
func (r *MediaRepository) Create(media *models.Media) error {
	return r.db.QueryRow(`
		INSERT INTO media (event_id, file_path, type) 
		VALUES ($1, $2, $3)
		RETURNING id
	`, media.EventID, media.FilePath, media.Type).Scan(&media.ID)
}

// GetByID retrieves a media record by ID
func (r *MediaRepository) GetByID(id int) (*models.Media, error) {
	var media models.Media
	err := r.db.QueryRow(`
		SELECT id, event_id, file_path, type 
		FROM media 
		WHERE id = $1
	`, id).Scan(&media.ID, &media.EventID, &media.FilePath, &media.Type)

	if err != nil {
		return nil, err
	}

	return &media, nil
}

// Delete deletes a media record
func (r *MediaRepository) Delete(id int) error {
	_, err := r.db.Exec("DELETE FROM media WHERE id = $1", id)
	return err
}
