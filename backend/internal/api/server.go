package api

import (
	"database/sql"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/protest-tracker/internal/auth"
	"github.com/protest-tracker/internal/config"
	"github.com/protest-tracker/internal/handlers"
	"github.com/protest-tracker/internal/middleware"
	"github.com/protest-tracker/internal/repository"
	"github.com/protest-tracker/internal/services"
)

type Server struct {
	router *mux.Router
	config *config.Config
}

func NewServer(db *sql.DB, cfg *config.Config) *Server {
	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	eventRepo := repository.NewEventRepository(db)
	mediaRepo := repository.NewMediaRepository(db)
	subscriptionRepo := repository.NewSubscriptionRepository(db)

	// Initialize auth service
	authService := auth.NewService(cfg.JWTSecret)

	// Initialize services
	authSvc := services.NewAuthService(userRepo, authService)
	eventSvc := services.NewEventService(eventRepo, subscriptionRepo)
	mediaSvc := services.NewMediaService(mediaRepo, eventRepo, cfg.MediaDir)
	witnessSvc := services.NewWitnessService(subscriptionRepo, eventRepo)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authSvc)
	eventHandler := handlers.NewEventHandler(eventSvc)
	mediaHandler := handlers.NewMediaHandler(mediaSvc)
	witnessHandler := handlers.NewWitnessHandler(witnessSvc)

	// Create server
	server := &Server{
		router: mux.NewRouter(),
		config: cfg,
	}

	// Setup routes
	server.setupRoutes(authHandler, eventHandler, mediaHandler, witnessHandler, cfg.JWTSecret)

	return server
}

func (s *Server) setupRoutes(
	authHandler *handlers.AuthHandler,
	eventHandler *handlers.EventHandler,
	mediaHandler *handlers.MediaHandler,
	witnessHandler *handlers.WitnessHandler,
	jwtSecret string,
) {
	// Apply CORS middleware
	s.router.Use(middleware.CORSMiddleware)

	// Public routes
	s.router.HandleFunc("/api/login", authHandler.Login).Methods("POST")
	s.router.HandleFunc("/api/register", authHandler.Register).Methods("POST")

	// Health check
	s.router.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		handlers.RespondJSON(w, map[string]string{"status": "ok"})
	}).Methods("GET")

	// Protected routes
	api := s.router.PathPrefix("/api").Subrouter()
	api.Use(middleware.AuthMiddleware(jwtSecret))

	// Event routes (accessible to both spotters and advocates)
	api.HandleFunc("/events", eventHandler.GetEvents).Methods("GET")
	api.HandleFunc("/events/{id}", eventHandler.GetEvent).Methods("GET")
	api.HandleFunc("/events", eventHandler.CreateEvent).Methods("POST")
	api.HandleFunc("/events/{id}", eventHandler.UpdateEvent).Methods("PUT")
	api.HandleFunc("/events/{id}", eventHandler.DeleteEvent).Methods("DELETE")
	api.HandleFunc("/events/{id}/subscribe", eventHandler.SubscribeEvent).Methods("POST")
	api.HandleFunc("/events/{id}/subscribe", eventHandler.UnsubscribeEvent).Methods("DELETE")

	// Media upload (accessible to spotters)
	api.HandleFunc("/events/{id}/media", mediaHandler.UploadMedia).Methods("POST")

	// Advocate-only routes
	advocateRoutes := api.PathPrefix("").Subrouter()
	advocateRoutes.Use(middleware.AdvocateOnlyMiddleware)

	// Media viewing (advocates only)
	advocateRoutes.HandleFunc("/events/{id}/media", mediaHandler.GetEventMedia).Methods("GET")
	advocateRoutes.HandleFunc("/events/{id}/media/{mediaId}", mediaHandler.GetMedia).Methods("GET")
	advocateRoutes.HandleFunc("/events/{id}/media/{mediaId}", mediaHandler.DeleteMedia).Methods("DELETE")

	// Witness contact (advocates only)
	advocateRoutes.HandleFunc("/events/{id}/contact-witnesses", witnessHandler.ContactWitnesses).Methods("POST")
	advocateRoutes.HandleFunc("/events/{id}/witness-count", witnessHandler.GetWitnessCount).Methods("GET")
}

func (s *Server) Start() error {
	addr := fmt.Sprintf(":%s", s.config.Port)
	return http.ListenAndServe(addr, s.router)
}
