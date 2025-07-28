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
  
  // New state for filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [eventAddresses, setEventAddresses] = useState({}); // Cache for addresses
  
  // Map time filter - default to last 24 hours
  const [mapTimeFilter, setMapTimeFilter] = useState('24h');
  
  const { user, isSpotter } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadEvents();
  }, []);

  // Fetch addresses for events when they load
  useEffect(() => {
    if (events.length > 0) {
      fetchEventAddresses();
    }
  }, [events]);

  const fetchEventAddresses = async () => {
    const addressPromises = events.map(async (event) => {
      if (!event.latitude || !event.longitude || eventAddresses[event.id]) {
        return null;
      }

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${event.latitude}&lon=${event.longitude}&addressdetails=1`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.display_name) {
            const address = data.address || {};
            const parts = [];
            
            if (address.house_number && address.road) {
              parts.push(`${address.house_number} ${address.road}`);
            } else if (address.road) {
              parts.push(address.road);
            }
            
            if (address.city || address.town || address.village) {
              parts.push(address.city || address.town || address.village);
            }
            
            if (address.state) {
              parts.push(address.state);
            }
            
            return {
              eventId: event.id,
              address: parts.length > 0 ? parts.join(', ') : data.display_name
            };
          }
        }
      } catch (error) {
        console.error('Error fetching address for event', event.id, error);
      }
      return null;
    });

    const addresses = await Promise.all(addressPromises);
    const addressMap = {};
    addresses.forEach(item => {
      if (item) {
        addressMap[item.eventId] = item.address;
      }
    });
    
    setEventAddresses(prev => ({ ...prev, ...addressMap }));
  };

  // Filter events for map based on time filter
  const getMapFilteredEvents = () => {
    if (mapTimeFilter === 'all') return events;
    
    const now = new Date();
    let cutoffTime;
    
    switch (mapTimeFilter) {
      case '1h':
        cutoffTime = new Date(now.getTime() - 1 * 60 * 60 * 1000);
        break;
      case '6h':
        cutoffTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '24h':
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        return events;
    }
    
    return events.filter(event => {
      const eventTime = event.time || event.timestamp;
      if (!eventTime) return false;
      
      const eventDate = new Date(eventTime);
      return eventDate >= cutoffTime;
    });
  };

  const mapFilteredEvents = getMapFilteredEvents();

  // Filter events based on search query and date range (for list view)
  const filteredEvents = events.filter(event => {
    // Date filtering - handle both 'time' and 'timestamp' fields
    const eventTime = event.time || event.timestamp;
    
    if (dateFrom && eventTime) {
      const eventDate = new Date(eventTime);
      const fromDate = new Date(dateFrom);
      if (eventDate < fromDate) return false;
    }
    
    if (dateTo && eventTime) {
      const eventDate = new Date(eventTime);
      const toDate = new Date(dateTo + 'T23:59:59'); // End of day
      if (eventDate > toDate) return false;
    }

    // Search query filtering
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      
      // Search in event ID
      if (event.id.toString().includes(query)) return true;
      
      // Search in cached address
      const address = eventAddresses[event.id];
      if (address && address.toLowerCase().includes(query)) return true;
      
      // Search in coordinates as fallback
      const coords = `${event.latitude}, ${event.longitude}`;
      if (coords.toLowerCase().includes(query)) return true;
      
      // Search in notes
      if (event.notes && event.notes.toLowerCase().includes(query)) return true;
      
      return false;
    }
    
    return true;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
  };

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
          <div className="view-toggles" style={{ 
            display: 'flex', 
            gap: '10px', 
            marginBottom: '10px' 
          }}>
            <button 
              className={`btn ${view === 'map' ? '' : 'btn-secondary'}`}
              onClick={() => setView('map')}
              style={{
                padding: '8px 16px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: view === 'map' ? '#007bff' : '#6c757d',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Map View
            </button>
            <button 
              className={`btn ${view === 'list' ? '' : 'btn-secondary'}`}
              onClick={() => setView('list')}
              style={{
                padding: '8px 16px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: view === 'list' ? '#007bff' : '#6c757d',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              List View
            </button>
          </div>

          {isSpotter && (
            <button 
              className="btn"
              onClick={() => navigate('/submit-event')}
              style={{
                padding: '8px 16px',
                border: '1px solid #007bff',
                borderRadius: '4px',
                backgroundColor: '#007bff',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Submit New Event
            </button>
          )}
        </div>

        {/* Time filter controls - only show in map view */}
        {view === 'map' && (
          <div className="map-filter-controls" style={{ 
            background: '#f8f9fa', 
            padding: '10px 15px', 
            borderRadius: '8px', 
            marginBottom: '10px',
            border: '1px solid #dee2e6',
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
              Show events from:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { value: '1h', label: 'Last Hour' },
                { value: '6h', label: 'Last 6 Hours' },
                { value: '24h', label: 'Last 24 Hours' },
                { value: '7d', label: 'Last 7 Days' },
                { value: '30d', label: 'Last 30 Days' },
                { value: 'all', label: 'All Time' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setMapTimeFilter(option.value)}
                  style={{
                    padding: '4px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '20px',
                    backgroundColor: mapTimeFilter === option.value ? '#007bff' : 'white',
                    color: mapTimeFilter === option.value ? 'white' : '#333',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <span style={{ fontSize: '12px', color: '#666', marginLeft: 'auto' }}>
              Showing {mapFilteredEvents.length} of {events.length} events
            </span>
          </div>
        )}

        {/* Filtering controls - only show in list view */}
        {view === 'list' && (
          <div className="filter-controls" style={{ 
            background: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            border: '1px solid #dee2e6'
          }}>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: '1', minWidth: '200px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '5px' }}>
                  Search Events
                </label>
                <input
                  type="text"
                  placeholder="Search by address, event # or notes"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div style={{ minWidth: '120px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '5px' }}>
                  From Date
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div style={{ minWidth: '120px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '5px' }}>
                  To Date
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div style={{ alignSelf: 'flex-end' }}>
                <button
                  onClick={clearFilters}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px' }}
                >
                  Clear
                </button>
              </div>
            </div>
            
            {(searchQuery || dateFrom || dateTo) && (
              <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                Showing {filteredEvents.length} of {events.length} events
                {searchQuery && <span> • Search: "{searchQuery}"</span>}
                {dateFrom && <span> • From: {new Date(dateFrom).toLocaleDateString()}</span>}
                {dateTo && <span> • To: {new Date(dateTo).toLocaleDateString()}</span>}
              </div>
            )}
          </div>
        )}

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
                  events={mapFilteredEvents}
                  onEventClick={handleEventClick}
                  onLongClick={handleMapLongClick}
                  enableLongClick={isSpotter}
                />
                <div className="event-count">
                  Showing {mapFilteredEvents.length} events on map
                  {mapTimeFilter !== 'all' && (
                    <span style={{ color: '#666', fontSize: '12px' }}>
                      {' '}(filtered by {
                        mapTimeFilter === '1h' ? 'last hour' :
                        mapTimeFilter === '6h' ? 'last 6 hours' :
                        mapTimeFilter === '24h' ? 'last 24 hours' :
                        mapTimeFilter === '7d' ? 'last 7 days' :
                        mapTimeFilter === '30d' ? 'last 30 days' : ''
                      })
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="events-list">
                <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
                  List View - {filteredEvents.length} events
                </div>
                {filteredEvents.length === 0 ? (
                  <div className="alert alert-info">
                    {searchQuery || dateFrom || dateTo 
                      ? 'No events match your filters. Try adjusting your search criteria.'
                      : 'No events to display in list view.'
                    }
                  </div>
                ) : (
                  <div className="events-grid grid grid-2">
                    {filteredEvents.map(event => (
                      <EventCard
                        key={event.id}
                        event={event}
                        showSubscribeButton={isSpotter}
                        onSubscribe={handleSubscribe}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="dashboard-stats">
          <div className="stats-grid grid grid-3">
            <div className="stat-card card">
              <h3>Total Events</h3>
              <div className="stat-number">
                {view === 'list' ? filteredEvents.length : mapFilteredEvents.length}
              </div>
              {((view === 'list' && filteredEvents.length !== events.length) || 
                (view === 'map' && mapFilteredEvents.length !== events.length)) && (
                <small style={{ color: '#666' }}>of {events.length} total</small>
              )}
            </div>
            <div className="stat-card card">
              <h3>Recent Events</h3>
              <div className="stat-number">
                {(view === 'list' ? filteredEvents : mapFilteredEvents).filter(e => 
                  new Date(e.time || e.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                ).length}
              </div>
              <small style={{ color: '#666' }}>Last 24 hours</small>
            </div>
            <div className="stat-card card">
              <h3>Total Arrests</h3>
              <div className="stat-number">
                {(view === 'list' ? filteredEvents : mapFilteredEvents).reduce((sum, e) => sum + (e.arrested_count || 0), 0)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;