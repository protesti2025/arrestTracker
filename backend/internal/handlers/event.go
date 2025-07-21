package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/protest-tracker/internal/models"
	"github.com/protest-tracker/internal/services"
)

type EventHandler struct {
	eventService *services.EventService
}

func NewEventHandler(eventService *services.EventService) *EventHandler {
	return &EventHandler{
		eventService: eventService,
	}
}

// GetEvents retrieves all events
func (h *EventHandler) GetEvents(w http.ResponseWriter, r *http.Request) {
	events, err := h.eventService.GetAllEvents()
	if err != nil {
		RespondError(w, "Database error", http.StatusInternalServerError)
		return
	}

	RespondJSON(w, events)
}

// GetEvent retrieves a specific event by ID
func (h *EventHandler) GetEvent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	eventID, err := strconv.Atoi(vars["id"])
	if err != nil {
		RespondError(w, "Invalid event ID", http.StatusBadRequest)
		return
	}

	event, err := h.eventService.GetEventByID(eventID)
	if err != nil {
		RespondError(w, "Event not found", http.StatusNotFound)
		return
	}

	RespondJSON(w, event)
}

// CreateEvent creates a new event
func (h *EventHandler) CreateEvent(w http.ResponseWriter, r *http.Request) {
	var event models.ArrestEvent
	if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
		RespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	userID := GetUserIDFromRequest(r)
	event.CreatedBy = userID

	eventID, err := h.eventService.CreateEvent(&event)
	if err != nil {
		RespondError(w, err.Error(), http.StatusBadRequest)
		return
	}

	RespondJSON(w, models.EventResponse{ID: eventID})
}

// UpdateEvent updates an existing event
func (h *EventHandler) UpdateEvent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	eventID, err := strconv.Atoi(vars["id"])
	if err != nil {
		RespondError(w, "Invalid event ID", http.StatusBadRequest)
		return
	}

	var event models.ArrestEvent
	if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
		RespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	event.ID = eventID
	err = h.eventService.UpdateEvent(&event)
	if err != nil {
		RespondError(w, err.Error(), http.StatusBadRequest)
		return
	}

	RespondJSON(w, models.MessageResponse{Message: "Event updated successfully"})
}

// DeleteEvent deletes an event
func (h *EventHandler) DeleteEvent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	eventID, err := strconv.Atoi(vars["id"])
	if err != nil {
		RespondError(w, "Invalid event ID", http.StatusBadRequest)
		return
	}

	err = h.eventService.DeleteEvent(eventID)
	if err != nil {
		RespondError(w, err.Error(), http.StatusBadRequest)
		return
	}

	RespondJSON(w, models.MessageResponse{Message: "Event deleted successfully"})
}

// SubscribeEvent subscribes a user to an event
func (h *EventHandler) SubscribeEvent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	eventID, err := strconv.Atoi(vars["id"])
	if err != nil {
		RespondError(w, "Invalid event ID", http.StatusBadRequest)
		return
	}

	userID := GetUserIDFromRequest(r)

	err = h.eventService.SubscribeToEvent(eventID, userID)
	if err != nil {
		RespondError(w, err.Error(), http.StatusBadRequest)
		return
	}

	RespondJSON(w, models.MessageResponse{Message: "Subscribed successfully"})
}

// UnsubscribeEvent unsubscribes a user from an event
func (h *EventHandler) UnsubscribeEvent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	eventID, err := strconv.Atoi(vars["id"])
	if err != nil {
		RespondError(w, "Invalid event ID", http.StatusBadRequest)
		return
	}

	userID := GetUserIDFromRequest(r)

	err = h.eventService.UnsubscribeFromEvent(eventID, userID)
	if err != nil {
		RespondError(w, err.Error(), http.StatusBadRequest)
		return
	}

	RespondJSON(w, models.MessageResponse{Message: "Unsubscribed successfully"})
}
