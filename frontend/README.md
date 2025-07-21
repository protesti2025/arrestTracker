# Protest Tracker - Frontend

A React-based web application for tracking protest events and police activity to protect civil rights. This application allows Spotters to report events and Advocates to access collected data and media.

## 🚀 Features

- **Role-based Authentication**: JWT-based auth with Spotter and Advocate roles
- **Interactive Event Map**: Leaflet.js integration for visualizing events
- **Event Reporting**: Comprehensive form for Spotters to document incidents
- **Media Upload**: Photo and video evidence collection
- **Real-time Updates**: Event subscription system for notifications
- **Responsive Design**: Mobile and desktop compatible
- **Privacy-focused**: Secure data handling and encrypted communications

## 🛠️ Tech Stack

- **React 18** with functional components and hooks
- **React Router** for navigation
- **Axios** for API communication
- **Leaflet.js** with React-Leaflet for maps
- **JWT-decode** for token handling
- **CSS3** with responsive design

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A running backend API (see backend documentation)

## 🏃‍♂️ Getting Started

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd protest-tracker

# Install dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
REACT_APP_API_BASE_URL=http://localhost:8080/api
```

### 3. Run Development Server

```bash
npm start
```

The application will be available at `http://localhost:3000`

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Auth/           # Authentication components
│   ├── Map/            # Map-related components
│   ├── Events/         # Event management components
│   ├── Media/          # Media upload/display components
│   ├── UI/             # Generic UI elements
│   └── Layout/         # Layout components
├── pages/              # Full-screen pages
├── services/           # API and utility services
├── hooks/              # Custom React hooks
├── context/            # React Context providers
├── utils/              # Helper functions
└── styles/             # CSS files
```

## 🔐 User Roles

### Spotter
- Report new events with location, time, and details
- Upload photos and videos as evidence
- Subscribe to event updates
- View event map and basic information

### Advocate
- Access all event data and media
- Contact witnesses when appropriate
- View detailed analytics and reports
- Coordinate legal response efforts

## 📱 Key Components

### Authentication
- JWT-based login system
- Role-based route protection
- Automatic token refresh handling

### Event Management
- Interactive map with event markers
- Comprehensive event submission form
- Real-time event updates
- Media attachment system

### Data Privacy
- Encrypted API communications
- Secure token storage
- Privacy-respecting data collection

## 🗺️ API Integration

The frontend connects to a REST API with the following key endpoints:

- `POST /login` - User authentication
- `GET/POST /events` - Event management
- `POST /events/:id/media` - Media upload
- `POST /events/:id/subscribe` - Event subscriptions
- `POST /events/:id/contact-witnesses` - Witness communication

## 🎨 Styling

The application uses CSS3 with:
- CSS Grid and Flexbox for layouts
- CSS custom properties for theming
- Responsive design patterns
- Mobile-first approach

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_BASE_URL` | Backend API URL | `http://localhost:8080/api` |
| `REACT_APP_DEFAULT_MAP_LAT` | Default map latitude | `40.7128` |
| `REACT_APP_DEFAULT_MAP_LNG` | Default map longitude | `-74.0060` |
| `REACT_APP_DEFAULT_MAP_ZOOM` | Default map zoom level | `13` |

## 🚀 Build and Deploy

```bash
# Build for production
npm run build

# The build folder contains optimized static files
# Deploy to your preferred hosting service
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## 📄 License

This project is designed to support civil rights documentation and should be used responsibly and in accordance with local laws.

## 🤝 Contributing

1. Follow the established code structure
2. Maintain privacy and security best practices
3. Test thoroughly before submitting changes
4. Document any new features or API changes

## ⚠️ Security Considerations

- Never log sensitive user data
- Validate all user inputs
- Use HTTPS in production
- Implement proper CORS policies
- Regular security audits recommended

## 📞 Support

For technical issues or questions about implementation, please refer to the project documentation or create an issue in the repository.

---

**Remember**: This tool is designed to help protect civil rights and should be used responsibly. Always prioritize personal safety when documenting events.se