package database

import (
	"database/sql"
	"log"

	_ "github.com/lib/pq"
)

// Initialize creates and configures the database connection
func Initialize(databaseURL string) (*sql.DB, error) {
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return nil, err
	}

	if err = db.Ping(); err != nil {
		return nil, err
	}

	// Create tables
	if err = createTables(db); err != nil {
		return nil, err
	}

	log.Println("Database connected and initialized successfully")
	return db, nil
}

func createTables(db *sql.DB) error {
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
			return err
		}
	}

	return nil
}