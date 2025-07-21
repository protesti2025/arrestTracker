package handlers

import (
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/protest-tracker/internal/models"
	"github.com/protest-tracker/internal/services"
)

type MediaHandler struct {
	mediaService *services.MediaService
}

func NewMediaHandler(mediaService *services.MediaService) *MediaHandler {
	return &MediaHandler{
		mediaService: mediaService,
	}
}

// GetEventMedia retrieves all media for an event
func (h *MediaHandler) GetEventMedia(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	eventID, err := strconv.Atoi(vars["id"])
	if err != nil {
		RespondError(w, "Invalid event ID", http.StatusBadRequest)
		return
	}

	media, err := h.mediaService.GetEventMedia(eventID)
	if err != nil {
		RespondError(w, err.Error(), http.StatusBadRequest)
		return
	}

	RespondJSON(w, media)
}

// UploadMedia handles media file uploads
func (h *MediaHandler) UploadMedia(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	eventID, err := strconv.Atoi(vars["id"])
	if err != nil {
		RespondError(w, "Invalid event ID", http.StatusBadRequest)
		return
	}

	// Parse multipart form
	err = r.ParseMultipartForm(10 << 20) // 10MB limit
	if err != nil {
		RespondError(w, "Failed to parse form", http.StatusBadRequest)
		return
	}

	file, handler, err := r.FormFile("file")
	if err != nil {
		RespondError(w, "Failed to get file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	mediaType := r.FormValue("type")
	if mediaType != "photo" && mediaType != "video" {
		RespondError(w, "Invalid media type", http.StatusBadRequest)
		return
	}

	err = h.mediaService.UploadMedia(eventID, file, handler.Filename, mediaType)
	if err != nil {
		RespondError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	RespondJSON(w, models.MessageResponse{Message: "Media uploaded successfully"})
}

// DeleteMedia deletes a media file
func (h *MediaHandler) DeleteMedia(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	mediaID, err := strconv.Atoi(vars["mediaId"])
	if err != nil {
		RespondError(w, "Invalid media ID", http.StatusBadRequest)
		return
	}

	err = h.mediaService.DeleteMedia(mediaID)
	if err != nil {
		RespondError(w, err.Error(), http.StatusBadRequest)
		return
	}

	RespondJSON(w, models.MessageResponse{Message: "Media deleted successfully"})
}

// GetMedia retrieves a specific media file
func (h *MediaHandler) GetMedia(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	mediaID, err := strconv.Atoi(vars["mediaId"])
	if err != nil {
		RespondError(w, "Invalid media ID", http.StatusBadRequest)
		return
	}

	media, err := h.mediaService.GetMediaByID(mediaID)
	if err != nil {
		RespondError(w, "Media not found", http.StatusNotFound)
		return
	}

	RespondJSON(w, media)
}
