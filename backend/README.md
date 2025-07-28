# Protest Arrest Tracking WebApp - Technical Documentation

## Project Overview
The Protest Arrest Tracking WebApp is a secure platform designed to assist protesters in tracking and reporting illegal police arrests. It enables two types of users: **Spotters** and **Advocates**. Spotters can submit reports about arrests, while Advocates can access all submitted data, contact witnesses, and coordinate legal support.

## User Roles

### Spotters:
- Submit new arrest reports with details.
- Upload photos and videos as evidence.
- Subscribe to events to offer testimony.
- View the map with reported arrests.

### Advocates:
- All Spotter privileges.
- Access full event details and evidence.
- Receive notifications about new events.
- Contact subscribers for testimony.

## Key Features
- Interactive map displaying arrest events.
- Role-based access control (Spotters vs. Advocates).
- Secure submission of arrest details.
- Photo and video evidence upload.
- Subscription system for witnesses.
- Advocate-triggered contact requests for testimony.
- Realtime notifications for Advocates.

## Technology Stack
- **Backend:** Go (Golang) with net/http or Echo/Fiber framework.
- **Frontend:** React or plain HTML/JS with Leaflet.js or Mapbox for map rendering.
- **Database:** PostgreSQL with PostGIS extension for spatial data.
- **Authentication:** JWT tokens with Role-based Access Control (RBAC).
- **Media Storage:** Local filesystem for prototypes; scalable to AWS S3 for production.
- **Notifications:** Email and/or WebSocket-based real-time alerts.

## Data Models

### User
```plaintext
ID: Integer
Email: String
Password: String (hashed)
Role: String ("spotter" or "advocate")
```

### ArrestEvent
```plaintext
ID: Integer
Time: Timestamp
Latitude: Float
Longitude: Float
Notes: String
CreatedBy: Integer (User ID)
```

### Media
```plaintext
ID: Integer
EventID: Integer
FilePath: String
Type: String ("photo" or "video")
```

### Subscription
```plaintext
ID: Integer
EventID: Integer
UserID: Integer
```

## API Endpoints

### Authentication
| Endpoint  | Method | Access | Description |
|-----------|--------|--------|-------------|
| `/login`  | POST   | Public | Authenticate user, returns JWT token. |

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "token": "<jwt_token>"
}
```

### Event Management
| Endpoint   | Method | Access   | Description               |
|------------|--------|----------|---------------------------|
| `/events`  | GET    | Spotter+ | List all events for map.  |
| `/events`  | POST   | Spotter+ | Submit new arrest event.  |

**Submit Event Request:**
```json
{
  "time": "2024-07-06T19:00:00Z",
  "latitude": 44.7866,
  "longitude": 20.4489,
  "notes": "Arrest during peaceful protest."
}
```
**Response:**
```json
{
  "id": 123
}
```

### Subscriptions
| Endpoint                | Method | Access   | Description                  |
|-------------------------|--------|----------|------------------------------|
| `/events/:id/subscribe` | POST   | Spotter+ | Subscribe to testify for event. |

**Response:**
```json
{
  "message": "Subscribed successfully."
}
```

### Media Upload and Retrieval
| Endpoint               | Method | Access   | Description                   |
|-----------------------|--------|----------|-------------------------------|
| `/events/:id/media`   | POST   | Spotter+ | Upload photo or video evidence. |
| `/events/:id/media`   | GET    | Advocate | Retrieve list of media files.  |

**Media Upload Example:**
`multipart/form-data` with fields:
- `file`: Photo or video file.
- `type`: "photo" or "video".

**Media List Response:**
```json
[
  { "id": 1, "filePath": "/media/event1/photo1.jpg", "type": "photo" },
  { "id": 2, "filePath": "/media/event1/video1.mp4", "type": "video" }
]
```

### Advocate Controls
| Endpoint                          | Method | Access   | Description                    |
|-----------------------------------|--------|----------|---------------------------------|
| `/events/:id/contact-witnesses`   | POST   | Advocate | Notify subscribers to testify. |

**Request:**
```json
{
  "message": "Contact Advocate John Doe at john@server.com to testify in arrest at [location] on [date]."
}
```
**Response:**
```json
{
  "message": "Witnesses notified."
}
```

## Security Considerations
- All sensitive operations require valid JWT tokens.
- Role-based middleware restricts access for sensitive actions.
- Media stored with appropriate access control.
- Passwords hashed with strong algorithms (bcrypt recommended).
- Minimal logging to protect user privacy.

## Future Enhancements
- WebSocket-based realtime updates.
- SMS notification option.
- Responsive mobile frontend.
- Anonymity mode for Spotters.
- Map clustering and filtering features.

## Conclusion
This platform provides a secure system for protest communities to document arrests and coordinate legal support. It empowers Spotters and Advocates through evidence collection, notifications, and structured testimony coordination.
