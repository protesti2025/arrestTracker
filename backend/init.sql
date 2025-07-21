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
    police_count INTEGER NOT NULL,
    arrested_count INTEGER NOT NULL,
    car_plates TEXT,
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

-- Insert sample events
INSERT INTO arrest_events (time, latitude, longitude, police_count, arrested_count, car_plates, notes, created_by) VALUES 
    ('2024-01-15 14:30:00', 37.7749, -122.4194, 15, 3, 'ABC123, DEF456', 'Peaceful protest turned violent', 1),
    ('2024-01-16 16:45:00', 37.7849, -122.4094, 8, 1, 'GHI789', 'Single arrest during demonstration', 1),
    ('2024-01-17 12:00:00', 37.7649, -122.4294, 20, 5, 'JKL012, MNO345, PQR678', 'Multiple arrests at city hall', 1)
ON CONFLICT DO NOTHING;