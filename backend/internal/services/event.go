package services

import (
	"errors"

	"github.com/protest-tracker/internal/models"
	"github.com/protest-tracker/internal/repository"
)

type EventService struct {
	eventRepo        *repository.EventRepository
	subscriptionRepo *repository.SubscriptionRepository
}

func NewEventService(eventRepo *repository.EventRepository, subscriptionRepo *repository.SubscriptionRepository) *EventService {
	return &EventService{
		eventRepo:        eventRepo,
		subscriptionRepo: subscriptionRepo,
	}
}

// GetAllEvents retrieves all events
func (s *EventService) GetAllEvents() ([]models.ArrestEvent, error) {
	return s.eventRepo.GetAll()
}

// GetEventByID retrieves an event by ID
func (s *EventService) GetEventByID(id int) (*models.ArrestEvent, error) {
	return s.eventRepo.GetByID(id)
}

// CreateEvent creates a new event
func (s *EventService) CreateEvent(event *models.ArrestEvent) (int, error) {
	// Validate required fields
	if event.Latitude == 0 || event.Longitude == 0 {
		return 0, errors.New("latitude and longitude are required")
	}

	return s.eventRepo.Create(event)
}

// UpdateEvent updates an existing event
func (s *EventService) UpdateEvent(event *models.ArrestEvent) error {
	// Check if event exists
	_, err := s.eventRepo.GetByID(event.ID)
	if err != nil {
		return errors.New("event not found")
	}

	return s.eventRepo.Update(event)
}

// DeleteEvent deletes an event
func (s *EventService) DeleteEvent(id int) error {
	// Check if event exists
	_, err := s.eventRepo.GetByID(id)
	if err != nil {
		return errors.New("event not found")
	}

	return s.eventRepo.Delete(id)
}

// SubscribeToEvent subscribes a user to an event
func (s *EventService) SubscribeToEvent(eventID, userID int) error {
	// Check if event exists
	_, err := s.eventRepo.GetByID(eventID)
	if err != nil {
		return errors.New("event not found")
	}

	return s.subscriptionRepo.Subscribe(eventID, userID)
}

// UnsubscribeFromEvent unsubscribes a user from an event
func (s *EventService) UnsubscribeFromEvent(eventID, userID int) error {
	return s.subscriptionRepo.Unsubscribe(eventID, userID)
}

// GetEventSubscribers retrieves all subscribers for an event
func (s *EventService) GetEventSubscribers(eventID int) ([]models.User, error) {
	return s.subscriptionRepo.GetSubscribersByEventID(eventID)
}
