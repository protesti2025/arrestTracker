package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/mux"
	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

// Configuration
const (
	JWTSecret = "your-secret-key-change-in-production"
	MediaDir  = "./media"
)

// Database connection
var db *sql.DB

// Models
type User struct {
	ID       int    `json:"id"`
	Email    string `json:"email"`
	Password string `json:"-"`
	Role     string `json:"role"`
}

type ArrestEvent struct {
	ID            int       `json:"id"`
	Time          time.Time `json:"time"`
	Latitude      float64   `json:"latitude"`
	Longitude     float64   `json:"longitude"`
	PoliceCount   int       `json:"policeCount"`
	ArrestedCount int       `json:"arrestedCount"`
	CarPlates     string    `json:"carPlates"`
	Notes         string    `json:"notes"`
	CreatedBy     int       `json:"createdBy"`
}

type Media struct {
	ID       int    `json:"id"`
	EventID  int    `json:"eventId"`
	FilePath string `json:"filePath"`
	Type     string `json:"type"`
}

type Subscription struct {
	ID      int `json:"id"`
	EventID int `json:"eventId"`
	UserID  int `json:"userId"`
}

// JWT Claims
type Claims struct {
	UserID int    `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// Request/Response structures
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
}

type EventResponse struct {
	ID int `json:"id"`
}

type MessageResponse struct {
	Message string `json:"message"`
}

type ContactWitnessRequest struct {
	Message string `json:"message"`
}

// Initialize database
func initDB() {
	var err error
	// Update with your database credentials
	connStr := "host=localhost port=5432 user=postgres password=postgres dbname=protest_tracker sslmode=disable"
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	if err = db.Ping(); err != nil {
		log.Fatal("Database connection failed:", err)
	}

	// Create tables
	createTables()
	log.Println("Database connected successfully")
}

func createTables() {
	queries := []string{
		`CREATE EXTENSION IF NOT EXISTS postgis;`,
		`CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			email VARCHAR(255) UNIQUE NOT NULL,
			password VARCHAR(255) NOT NULL,
			role VARCHAR(50) NOT NULL DEFAULT 'spotter'
		);`,
		`CREATE TABLE IF NOT EXISTS arrest_events (
			id SERIAL PRIMARY KEY,
			time TIMESTAMP NOT NULL,
			latitude FLOAT NOT NULL,
			longitude FLOAT NOT NULL,
			police_count INTEGER NOT NULL,
			arrested_count INTEGER NOT NULL,
			car_plates TEXT,
			notes TEXT,
			created_by INTEGER REFERENCES users(id),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS media (
			id SERIAL PRIMARY KEY,
			event_id INTEGER REFERENCES arrest_events(id),
			file_path VARCHAR(500) NOT NULL,
			type VARCHAR(50) NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS subscriptions (
			id SERIAL PRIMARY KEY,
			event_id INTEGER REFERENCES arrest_events(id),
			user_id INTEGER REFERENCES users(id),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(event_id, user_id)
		);`,
	}

	for _, query := range queries {
		_, err := db.Exec(query)
		if err != nil {
			log.Printf("Error creating table: %v", err)
		}
	}
}

// Middleware
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization header required", http.StatusUnauthorized)
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			http.Error(w, "Invalid authorization format", http.StatusUnauthorized)
			return
		}

		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			return []byte(JWTSecret), nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		claims, ok := token.Claims.(*Claims)
		if !ok {
			http.Error(w, "Invalid token claims", http.StatusUnauthorized)
			return
		}

		// Add user info to request context
		r.Header.Set("X-User-ID", strconv.Itoa(claims.UserID))
		r.Header.Set("X-User-Role", claims.Role)

		next.ServeHTTP(w, r)
	})
}

func advocateOnlyMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		role := r.Header.Get("X-User-Role")
		if role != "advocate" {
			http.Error(w, "Advocate access required", http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// Utility functions
func hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

func checkPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func generateToken(userID int, role string) (string, error) {
	claims := &Claims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(JWTSecret))
}

func getUserIDFromRequest(r *http.Request) int {
	userIDStr := r.Header.Get("X-User-ID")
	userID, _ := strconv.Atoi(userIDStr)
	return userID
}

func respondJSON(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, message string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}

// Handlers
func loginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		return
	}
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	var user User
	err := db.QueryRow("SELECT id, email, password, role FROM users WHERE email = $1", req.Email).
		Scan(&user.ID, &user.Email, &user.Password, &user.Role)

	if err != nil {
		if err == sql.ErrNoRows {
			respondError(w, "Invalid credentials", http.StatusUnauthorized)
			return
		}
		respondError(w, "Database error", http.StatusInternalServerError)
		return
	}

	if !checkPassword(req.Password, user.Password) {
		respondError(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	token, err := generateToken(user.ID, user.Role)
	if err != nil {
		respondError(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	respondJSON(w, LoginResponse{Token: token})
}

func getEventsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		return
	}
	rows, err := db.Query(`
		SELECT id, time, latitude, longitude, police_count, arrested_count, 
		       car_plates, notes, created_by 
		FROM arrest_events 
		ORDER BY time DESC
	`)
	if err != nil {
		respondError(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var events []ArrestEvent
	for rows.Next() {
		var event ArrestEvent
		var carPlates, notes sql.NullString

		err := rows.Scan(&event.ID, &event.Time, &event.Latitude, &event.Longitude,
			&event.PoliceCount, &event.ArrestedCount, &carPlates, &notes, &event.CreatedBy)
		if err != nil {
			respondError(w, "Database scan error", http.StatusInternalServerError)
			return
		}

		event.CarPlates = carPlates.String
		event.Notes = notes.String
		events = append(events, event)
	}

	respondJSON(w, events)
}

func createEventHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		return
	}
	var event ArrestEvent
	if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
		respondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	userID := getUserIDFromRequest(r)
	event.CreatedBy = userID

	var eventID int
	err := db.QueryRow(`
		INSERT INTO arrest_events (time, latitude, longitude, police_count, arrested_count, 
		                          car_plates, notes, created_by) 
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
		RETURNING id
	`, event.Time, event.Latitude, event.Longitude, event.PoliceCount,
		event.ArrestedCount, event.CarPlates, event.Notes, event.CreatedBy).Scan(&eventID)

	if err != nil {
		respondError(w, "Failed to create event", http.StatusInternalServerError)
		return
	}

	respondJSON(w, EventResponse{ID: eventID})
}

func subscribeEventHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		return
	}
	vars := mux.Vars(r)
	eventID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondError(w, "Invalid event ID", http.StatusBadRequest)
		return
	}

	userID := getUserIDFromRequest(r)

	_, err = db.Exec(`
		INSERT INTO subscriptions (event_id, user_id) 
		VALUES ($1, $2) 
		ON CONFLICT (event_id, user_id) DO NOTHING
	`, eventID, userID)

	if err != nil {
		respondError(w, "Failed to subscribe", http.StatusInternalServerError)
		return
	}

	respondJSON(w, MessageResponse{Message: "Subscribed successfully."})
}

func uploadMediaHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		return
	}
	vars := mux.Vars(r)
	eventID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondError(w, "Invalid event ID", http.StatusBadRequest)
		return
	}

	// Parse multipart form
	err = r.ParseMultipartForm(10 << 20) // 10MB limit
	if err != nil {
		respondError(w, "Failed to parse form", http.StatusBadRequest)
		return
	}

	file, handler, err := r.FormFile("file")
	if err != nil {
		respondError(w, "Failed to get file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	mediaType := r.FormValue("type")
	if mediaType != "photo" && mediaType != "video" {
		respondError(w, "Invalid media type", http.StatusBadRequest)
		return
	}

	// Create media directory if it doesn't exist
	eventDir := filepath.Join(MediaDir, fmt.Sprintf("event_%d", eventID))
	err = os.MkdirAll(eventDir, 0755)
	if err != nil {
		respondError(w, "Failed to create directory", http.StatusInternalServerError)
		return
	}

	// Generate unique filename
	filename := fmt.Sprintf("%d_%s", time.Now().Unix(), handler.Filename)
	filePath := filepath.Join(eventDir, filename)

	// Create file
	dst, err := os.Create(filePath)
	if err != nil {
		respondError(w, "Failed to create file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	// Copy file content
	_, err = io.Copy(dst, file)
	if err != nil {
		respondError(w, "Failed to save file", http.StatusInternalServerError)
		return
	}

	// Save to database
	_, err = db.Exec(`
		INSERT INTO media (event_id, file_path, type) 
		VALUES ($1, $2, $3)
	`, eventID, filePath, mediaType)

	if err != nil {
		respondError(w, "Failed to save media record", http.StatusInternalServerError)
		return
	}

	respondJSON(w, MessageResponse{Message: "Media uploaded successfully"})
}

func getMediaHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		return
	}
	vars := mux.Vars(r)
	eventID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondError(w, "Invalid event ID", http.StatusBadRequest)
		return
	}

	rows, err := db.Query(`
		SELECT id, event_id, file_path, type 
		FROM media 
		WHERE event_id = $1 
		ORDER BY created_at DESC
	`, eventID)
	if err != nil {
		respondError(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var mediaList []Media
	for rows.Next() {
		var media Media
		err := rows.Scan(&media.ID, &media.EventID, &media.FilePath, &media.Type)
		if err != nil {
			respondError(w, "Database scan error", http.StatusInternalServerError)
			return
		}
		mediaList = append(mediaList, media)
	}

	respondJSON(w, mediaList)
}

func contactWitnessesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		return
	}
	vars := mux.Vars(r)
	eventID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondError(w, "Invalid event ID", http.StatusBadRequest)
		return
	}

	var req ContactWitnessRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Get all subscribers for this event
	rows, err := db.Query(`
		SELECT u.email 
		FROM subscriptions s 
		JOIN users u ON s.user_id = u.id 
		WHERE s.event_id = $1
	`, eventID)
	if err != nil {
		respondError(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var emails []string
	for rows.Next() {
		var email string
		if err := rows.Scan(&email); err != nil {
			continue
		}
		emails = append(emails, email)
	}

	// In a real implementation, you would send emails here
	// For now, we'll just log the action
	log.Printf("Contacting witnesses for event %d: %v", eventID, emails)
	log.Printf("Message: %s", req.Message)

	respondJSON(w, MessageResponse{Message: "Witnesses notified."})
}

func main() {
	// Initialize database
	initDB()
	defer db.Close()

	// Create media directory
	err := os.MkdirAll(MediaDir, 0755)
	if err != nil {
		log.Fatal("Failed to create media directory:", err)
	}

	// Create router
	r := mux.NewRouter()

	// Apply CORS middleware
	r.Use(corsMiddleware)

	// Public routes
	r.HandleFunc("/api/login", loginHandler).Methods("POST", "OPTIONS")

	// Protected routes
	api := r.PathPrefix("/api").Subrouter()
	api.Use(authMiddleware)

	// Spotter+ routes
	api.HandleFunc("/events", getEventsHandler).Methods("GET", "OPTIONS")
	api.HandleFunc("/events", createEventHandler).Methods("POST", "OPTIONS")
	api.HandleFunc("/events/{id}/subscribe", subscribeEventHandler).Methods("POST", "OPTIONS")
	api.HandleFunc("/events/{id}/media", uploadMediaHandler).Methods("POST", "OPTIONS")

	// Advocate only routes
	advocateRoutes := api.PathPrefix("").Subrouter()
	advocateRoutes.Use(advocateOnlyMiddleware)
	advocateRoutes.HandleFunc("/events/{id}/media", getMediaHandler).Methods("GET", "OPTIONS")
	advocateRoutes.HandleFunc("/events/{id}/contact-witnesses", contactWitnessesHandler).Methods("POST", "OPTIONS")

	// Start server
	log.Println("Server starting on :8080...")
	log.Fatal(http.ListenAndServe(":8080", r))
}
