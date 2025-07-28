-- Initialize database with PostGIS extension and sample data

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create tables
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'spotter',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS arrest_events (
    id SERIAL PRIMARY KEY,
    time TIMESTAMP NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS media (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES arrest_events(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES arrest_events(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

-- Insert sample users (passwords are hashed version of "password")
INSERT INTO users (email, password, role) VALUES 
    ('spotter@example.com', '$2a$14$6b3UlWUGpDJ8Ye7JhzZ5TuJsJ5oL5.K5WkL8ZhzZ5TuJsJ5oL5.K5W', 'spotter'),
    ('advocate@example.com', '$2a$14$6b3UlWUGpDJ8Ye7JhzZ5TuJsJ5oL5.K5WkL8ZhzZ5TuJsJ5oL5.K5W', 'advocate')
ON CONFLICT (email) DO NOTHING;