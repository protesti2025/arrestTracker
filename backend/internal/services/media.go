package services

import (
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"

	"github.com/protest-tracker/internal/models"
	"github.com/protest-tracker/internal/repository"
)

type MediaService struct {
	mediaRepo *repository.MediaRepository
	eventRepo *repository.EventRepository
	mediaDir  string
}

func NewMediaService(mediaRepo *repository.MediaRepository, eventRepo *repository.EventRepository, mediaDir string) *MediaService {
	return &MediaService{
		mediaRepo: mediaRepo,
		eventRepo: eventRepo,
		mediaDir:  mediaDir,
	}
}

// GetEventMedia retrieves all media for an event
func (s *MediaService) GetEventMedia(eventID int) ([]models.Media, error) {
	// Check if event exists
	_, err := s.eventRepo.GetByID(eventID)
	if err != nil {
		return nil, errors.New("event not found")
	}

	return s.mediaRepo.GetByEventID(eventID)
}

// UploadMedia saves a media file and creates a database record
func (s *MediaService) UploadMedia(eventID int, file io.Reader, filename, mediaType string) error {
	// Check if event exists
	_, err := s.eventRepo.GetByID(eventID)
	if err != nil {
		return errors.New("event not found")
	}

	// Validate media type
	if mediaType != "photo" && mediaType != "video" {
		return errors.New("invalid media type")
	}

	// Create event directory
	eventDir := filepath.Join(s.mediaDir, fmt.Sprintf("event_%d", eventID))
	err = os.MkdirAll(eventDir, 0755)
	if err != nil {
		return fmt.Errorf("failed to create directory: %v", err)
	}

	// Generate unique filename
	uniqueFilename := fmt.Sprintf("%d_%s", time.Now().Unix(), filename)
	filePath := filepath.Join(eventDir, uniqueFilename)

	// Create file
	dst, err := os.Create(filePath)
	if err != nil {
		return fmt.Errorf("failed to create file: %v", err)
	}
	defer dst.Close()

	// Copy file content
	_, err = io.Copy(dst, file)
	if err != nil {
		return fmt.Errorf("failed to save file: %v", err)
	}

	// Save to database
	media := &models.Media{
		EventID:  eventID,
		FilePath: filePath,
		Type:     mediaType,
	}

	err = s.mediaRepo.Create(media)
	if err != nil {
		// Clean up file if database save fails
		os.Remove(filePath)
		return fmt.Errorf("failed to save media record: %v", err)
	}

	return nil
}

// DeleteMedia deletes a media file and its database record
func (s *MediaService) DeleteMedia(mediaID int) error {
	// Get media record
	media, err := s.mediaRepo.GetByID(mediaID)
	if err != nil {
		return errors.New("media not found")
	}

	// Delete file
	err = os.Remove(media.FilePath)
	if err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to delete file: %v", err)
	}

	// Delete database record
	err = s.mediaRepo.Delete(mediaID)
	if err != nil {
		return fmt.Errorf("failed to delete media record: %v", err)
	}

	return nil
}

// GetMediaByID retrieves a media record by ID
func (s *MediaService) GetMediaByID(id int) (*models.Media, error) {
	return s.mediaRepo.GetByID(id)
}
