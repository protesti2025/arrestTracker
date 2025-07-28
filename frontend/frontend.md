# LLM Instructions for React Frontend - Protest Arrest Tracking WebApp

## 🛠️ General Guidelines

- Use **React** with functional components and React hooks (`useState`, `useEffect`).
- Use **React Router** for navigation between pages.
- Use **Axios** for making API requests.
- Use **Leaflet.js** for map visualization.
- Follow organized file structure: separate components, pages, and services.
- Connect to the provided backend REST API (see Swagger and project documentation).
- Implement JWT-based authentication; store tokens in `localStorage`.

---

## ✅ Step-by-Step Instructions

### Step 1: Project Initialization

- Create project and install dependencies:
  ```bash
  npx create-react-app protest-tracker
  cd protest-tracker
  npm install axios react-router-dom leaflet jwt-decode
  ```
- Optional for advanced map features:
  ```bash
  npm install react-map-gl
  ```

---

### Step 2: Setup Folder Structure

Suggested file organization:

```
src/
├── components/         # Reusable UI elements
├── pages/              # Full-screen pages (Login, Dashboard, Event Details)
├── services/           # API and authentication utilities
├── App.js
├── index.js
```

---

### Step 3: Authentication System

- Build **LoginPage.jsx**:
  - Form with `email` and `password` fields.
  - Calls backend `/login` endpoint.
  - Store JWT token in `localStorage`.
  - Decode JWT to determine user `role`.
- In `services/auth.js`:
  - `login(email, password)`
  - `getToken()`
  - `getUserRole()` (parsed from token)

---

### Step 4: Routing with Role Protection

- Setup React Router:
  - `/login` - Public access
  - `/dashboard` - Spotter & Advocate access
  - `/events/:id` - Event details
- Restrict routes based on `role` from JWT.

---

### Step 5: Event Map Implementation

- Create Map component with Leaflet.
- Fetch events:
  ```http
  GET /events
  ```
- Display markers for each event.
- On marker click, show event info and link to details.

---

### Step 6: Event Submission (Spotters)

- Create Event Submission form with fields:
  - Time, Latitude, Longitude, Notes.
- Submit to:
  ```http
  POST /events
  ```

---

### Step 7: Media Upload Feature

- Spotters can upload evidence:
  ```http
  POST /events/:id/media
  ```
- Use `multipart/form-data` with fields:
  - `file` (image or video)
  - `type` ("photo" or "video")

---

### Step 8: Event Details & Media Display

- Event Details page:
  - Show event metadata.
  - Fetch and list media:
    ```http
    GET /events/:id/media
    ```
  - Media view restricted to Advocates.

---

### Step 9: Subscription System

- Allow Spotters to subscribe to events:
  ```http
  POST /events/:id/subscribe
  ```
- Show confirmation message on success.

---

### Step 10: Advocate-Only Controls

- Advocates can:
  - View all media.
  - Notify witnesses:
    ```http
    POST /events/:id/contact-witnesses
    ```
  - Form to compose notification message.

---

### Step 11: Optional Notifications

- Prepare frontend for future real-time updates via:
  - Polling `/events`
  - WebSocket integration (future enhancement)

---

### Step 12: UI Considerations

- Ensure responsive design for desktop & mobile.
- Provide user feedback for errors/success.
- Minimal, privacy-respecting interface.

---

### Step 13: Security Notes

- Send JWT token with all secured API calls:
  ```
  Authorization: Bearer <token>
  ```
- Hide Advocate-only features for unauthorized users.

---

### Step 14: Final Delivery

- Provide complete, functional React code.
