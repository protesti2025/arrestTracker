package services

import (
	"errors"
	"log"

	"github.com/protest-tracker/internal/repository"
)

type WitnessService struct {
	subscriptionRepo *repository.SubscriptionRepository
	eventRepo        *repository.EventRepository
}

func NewWitnessService(subscriptionRepo *repository.SubscriptionRepository, eventRepo *repository.EventRepository) *WitnessService {
	return &WitnessService{
		subscriptionRepo: subscriptionRepo,
		eventRepo:        eventRepo,
	}
}

// ContactWitnesses sends a message to all witnesses subscribed to an event
func (s *WitnessService) ContactWitnesses(eventID int, message string) error {
	// Check if event exists
	_, err := s.eventRepo.GetByID(eventID)
	if err != nil {
		return errors.New("event not found")
	}

	// Get all subscribers for this event
	subscribers, err := s.subscriptionRepo.GetSubscribersByEventID(eventID)
	if err != nil {
		return err
	}

	if len(subscribers) == 0 {
		return errors.New("no witnesses subscribed to this event")
	}

	// In a real implementation, you would send emails/notifications here
	// For now, we'll just log the action
	var emails []string
	for _, subscriber := range subscribers {
		emails = append(emails, subscriber.Email)
	}

	log.Printf("Contacting witnesses for event %d: %v", eventID, emails)
	log.Printf("Message: %s", message)

	// TODO: Implement actual email/notification sending
	// This could involve:
	// - Email service integration (SendGrid, AWS SES, etc.)
	// - Push notification service
	// - SMS service
	// - Webhook notifications

	return nil
}

// GetWitnessCount returns the number of witnesses for an event
func (s *WitnessService) GetWitnessCount(eventID int) (int, error) {
	subscribers, err := s.subscriptionRepo.GetSubscribersByEventID(eventID)
	if err != nil {
		return 0, err
	}
	return len(subscribers), nil
}
