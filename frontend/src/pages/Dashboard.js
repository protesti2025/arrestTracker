import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsAPI } from '../services/api';
import { useAuth } from '../services/AuthContext';
import EventMap from '../components/EventMap';
import EventCard from '../components/EventCard';
import './Dashboard.css';

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('map');
  const { user, isSpotter } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await eventsAPI.getAllEvents();
      setEvents(response.data || []);
    } catch (error) {
      console.error('Error loading events:', error);
      setError('Failed to load events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (event) => {
    navigate(`/events/${event.id}`);
  };

  const handleSubscribe = async (eventId) => {
    try {
      await eventsAPI.subscribeToEvent(eventId);
      alert('Successfully subscribed to event notifications!');
    } catch (error) {
      console.error('Subscribe error:', error);
      alert('Failed to subscribe to event');
    }
  };

  // NEW: Handle long clicks on map to create events
  const handleMapLongClick = async (coordinates) => {
    if (!isSpotter) {
      alert('Only spotters can submit events');
      return;
    }

    try {
      // Reverse geocode to get address from coordinates
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.lat}&lon=${coordinates.lng}&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        const address = data.display_name || `${coordinates.lat}, ${coordinates.lng}`;
        
        // Navigate to EventSubmission with pre-filled location data
        navigate('/submit-event', {
          state: {
            prefillData: {
              latitude: coordinates.lat.toString(),
              longitude: coordinates.lng.toString(),
              address: address
            }
          }
        });
      } else {
        // If reverse geocoding fails, still navigate with coordinates
        navigate('/submit-event', {
          state: {
            prefillData: {
              latitude: coordinates.lat.toString(),
              longitude: coordinates.lng.toString(),
              address: `Location: ${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`
            }
          }
        });
      }
    } catch (error) {
      console.error('Error with reverse geocoding:', error);
      // Still navigate even if geocoding fails
      navigate('/submit-event', {
        state: {
          prefillData: {
            latitude: coordinates.lat.toString(),
            longitude: coordinates.lng.toString(),
            address: `Location: ${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`
          }
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="main-content">
        <div className="dashboard-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome, {user?.email} ({user?.role})
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
            <button onClick={loadEvents} className="btn btn-secondary" style={{ marginLeft: '10px' }}>
              Retry
            </button>
          </div>
        )}

        <div className="dashboard-controls">
          <div className="view-toggles">
            <button 
              className={`btn ${view === 'map' ? '' : 'btn-secondary'}`}
              onClick={() => setView('map')}
            >
              Map View
            </button>
            <button 
              className={`btn ${view === 'list' ? '' : 'btn-secondary'}`}
              onClick={() => setView('list')}
            >
              List View
            </button>
          </div>

          {isSpotter && (
            <button 
              className="btn"
              onClick={() => navigate('/submit-event')}
            >
              Submit New Event
            </button>
          )}
        </div>

        {/* NEW: Add instruction for long click when in map view and user is spotter */}
        {view === 'map' && isSpotter && (
          <div className="alert alert-info" style={{ marginBottom: '10px' }}>
            💡 Tip: Long press on the map to quickly submit an event at that location
          </div>
        )}

        {events.length === 0 ? (
          <div className="alert alert-info">
            No events found. {isSpotter ? 'Submit the first event!' : ''}
          </div>
        ) : (
          <div className="dashboard-content">
            {view === 'map' ? (
              <div className="map-container">
                <EventMap 
                  events={events}
                  onEventClick={handleEventClick}
                  onLongClick={handleMapLongClick}
                  enableLongClick={isSpotter}
                />
                <div className="event-count">
                  Showing {events.length} events
                </div>
              </div>
            ) : (
              <div className="events-list">
                <div className="events-grid grid grid-2">
                  {events.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      showSubscribeButton={isSpotter}
                      onSubscribe={handleSubscribe}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="dashboard-stats">
          <div className="stats-grid grid grid-3">
            <div className="stat-card card">
              <h3>Total Events</h3>
              <div className="stat-number">{events.length}</div>
            </div>
            <div className="stat-card card">
              <h3>Recent Events</h3>
              <div className="stat-number">
                {events.filter(e => 
                  new Date(e.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                ).length}
              </div>
            </div>
            <div className="stat-card card">
              <h3>Total Arrests</h3>
              <div className="stat-number">
                {events.reduce((sum, e) => sum + (e.arrested_count || 0), 0)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;