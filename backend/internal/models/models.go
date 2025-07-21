package models

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// User represents a user in the system
type User struct {
	ID       int    `json:"id"`
	Email    string `json:"email"`
	Password string `json:"-"`
	Role     string `json:"role"`
}

// ArrestEvent represents a protest arrest event
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

// Media represents uploaded media files
type Media struct {
	ID       int    `json:"id"`
	EventID  int    `json:"eventId"`
	FilePath string `json:"filePath"`
	Type     string `json:"type"`
}

// Subscription represents event subscriptions
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