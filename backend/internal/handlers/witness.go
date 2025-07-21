package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/protest-tracker/internal/models"
	"github.com/protest-tracker/internal/services"
)

type WitnessHandler struct {
	witnessService *services.WitnessService
}

func NewWitnessHandler(witnessService *services.WitnessService) *WitnessHandler {
	return &WitnessHandler{
		witnessService: witnessService,
	}
}

// ContactWitnesses sends a message to all witnesses subscribed to an event
func (h *WitnessHandler) ContactWitnesses(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	eventID, err := strconv.Atoi(vars["id"])
	if err != nil {
		RespondError(w, "Invalid event ID", http.StatusBadRequest)
		return
	}

	var req models.ContactWitnessRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Message == "" {
		RespondError(w, "Message is required", http.StatusBadRequest)
		return
	}

	err = h.witnessService.ContactWitnesses(eventID, req.Message)
	if err != nil {
		RespondError(w, err.Error(), http.StatusBadRequest)
		return
	}

	RespondJSON(w, models.MessageResponse{Message: "Witnesses notified"})
}

// GetWitnessCount returns the number of witnesses for an event
func (h *WitnessHandler) GetWitnessCount(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	eventID, err := strconv.Atoi(vars["id"])
	if err != nil {
		RespondError(w, "Invalid event ID", http.StatusBadRequest)
		return
	}

	count, err := h.witnessService.GetWitnessCount(eventID)
	if err != nil {
		RespondError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	RespondJSON(w, map[string]int{"count": count})
}
