import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { eventsAPI } from '../services/api';
import './EventSubmission.css';

const EventSubmission = () => {
  const [formData, setFormData] = useState({
    latitude: '',
    longitude: '',
    address: '',
    police_count: '',
    arrested_count: '',
    car_plates: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  
  // New state for autocomplete
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Handle prefilled data from map long click
  useEffect(() => {
    if (location.state?.prefillData) {
      const { latitude, longitude, address } = location.state.prefillData;
      setFormData(prev => ({
        ...prev,
        latitude: latitude || '',
        longitude: longitude || '',
        address: address || ''
      }));
      // Clear suggestions when prefilling
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Trigger autocomplete for address field
    if (name === 'address') {
      if (value.length >= 3) {
        debouncedSearch(value);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (!query.trim() || query.length < 3) return;
      
      setSearchLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
        );
        
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data);
          setShowSuggestions(data.length > 0);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setSearchLoading(false);
      }
    }, 300),
    []
  );

  // Debounce utility function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  const selectSuggestion = (suggestion) => {
    setFormData(prev => ({
      ...prev,
      address: suggestion.display_name,
      latitude: parseFloat(suggestion.lat).toString(),
      longitude: parseFloat(suggestion.lon).toString()
    }));
    setSuggestions([]);
    setShowSuggestions(false);
    setError('');
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
          address: 'Current Location'
        }));
        setLocationLoading(false);
        setError('');
        setSuggestions([]);
        setShowSuggestions(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError('Unable to get current location');
        setLocationLoading(false);
      }
    );
  };

  const geocodeAddress = async (address) => {
    if (!address.trim()) {
      setError('Please enter an address');
      return;
    }

    setAddressLoading(true);
    setError('');

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }

      const data = await response.json();
      
      if (data.length === 0) {
        setError('Address not found. Please try a different address.');
        return;
      }

      const location = data[0];
      setFormData(prev => ({
        ...prev,
        latitude: parseFloat(location.lat).toString(),
        longitude: parseFloat(location.lon).toString()
      }));
      
      setError('');
      setSuggestions([]);
      setShowSuggestions(false);
    } catch (error) {
      console.error('Geocoding error:', error);
      setError('Failed to find address. Please try again.');
    } finally {
      setAddressLoading(false);
    }
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    geocodeAddress(formData.address);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!formData.latitude || !formData.longitude) {
        setError('Please select a location using address search or current location');
        setLoading(false);
        return;
      }

      const eventData = {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        police_count: formData.police_count ? parseInt(formData.police_count) : null,
        arrested_count: formData.arrested_count ? parseInt(formData.arrested_count) : null,
        timestamp: new Date().toISOString()
      };

      const response = await eventsAPI.createEvent(eventData);
      
      setSuccess('Event submitted successfully!');
      
      setFormData({
        latitude: '',
        longitude: '',
        address: '',
        police_count: '',
        arrested_count: '',
        car_plates: '',
        notes: ''
      });

      setTimeout(() => {
        navigate(`/events/${response.data.id}`);
      }, 2000);

    } catch (error) {
      console.error('Event submission error:', error);
      setError(
        error.response?.data?.message || 
        'Failed to submit event. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.address-input-container')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="container">
      <div className="main-content">
        <h1 className="page-title">Submit New Event</h1>
        <p className="page-subtitle">Report protest activities and police interactions</p>

        <div className="event-form-container">
          {location.state?.prefillData && (
            <div className="alert alert-success" style={{ marginBottom: '20px' }}>
              📍 Location auto-filled from map click
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="card">
            <h2>Event Details</h2>

            <div className="form-group">
              <label htmlFor="address">Address *</label>
              <div className="address-input-container" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      disabled={loading || addressLoading}
                      placeholder="Start typing an address..."
                      autoComplete="off"
                      style={{ width: '100%' }}
                    />
                    {searchLoading && (
                      <div style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '12px',
                        color: '#666'
                      }}>
                        Searching...
                      </div>
                    )}
                    
                    {/* Suggestions dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        border: '1px solid #ddd',
                        borderTop: 'none',
                        borderRadius: '0 0 4px 4px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        zIndex: 1000,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        {suggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            onClick={() => selectSuggestion(suggestion)}
                            style={{
                              padding: '10px',
                              cursor: 'pointer',
                              borderBottom: index < suggestions.length - 1 ? '1px solid #eee' : 'none',
                              fontSize: '14px',
                              lineHeight: '1.4'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                          >
                            <div style={{ fontWeight: '500', marginBottom: '2px' }}>
                              {suggestion.display_name.split(',')[0]}
                            </div>
                            <div style={{ color: '#666', fontSize: '12px' }}>
                              {suggestion.display_name}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleAddressSubmit}
                    className="btn btn-secondary"
                    disabled={loading || addressLoading || !formData.address.trim()}
                  >
                    {addressLoading ? 'Finding...' : 'Find Location'}
                  </button>
                </div>
              </div>
            </div>

            <div className="form-group">
              <button
                type="button"
                onClick={getCurrentLocation}
                className="btn btn-secondary"
                disabled={loading || locationLoading}
              >
                {locationLoading ? 'Getting Location...' : 'Use Current Location'}
              </button>
            </div>

            {formData.latitude && formData.longitude && (
              <div className="form-group">
                <div className="location-display" style={{ 
                  background: '#f8f9fa', 
                  padding: '10px', 
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  color: '#666'
                }}>
                  <strong>Selected Location:</strong><br/>
                  {formData.address || 'Current Location'}<br/>
                  <small>Lat: {parseFloat(formData.latitude).toFixed(6)}, Lng: {parseFloat(formData.longitude).toFixed(6)}</small>
                </div>
              </div>
            )}

            <div className="form-row" style={{ display: 'flex', gap: '15px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="police_count">Police Count</label>
                <input
                  type="number"
                  id="police_count"
                  name="police_count"
                  value={formData.police_count}
                  onChange={handleChange}
                  min="0"
                  disabled={loading}
                  placeholder="Number of police officers"
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="arrested_count">Arrested Count</label>
                <input
                  type="number"
                  id="arrested_count"
                  name="arrested_count"
                  value={formData.arrested_count}
                  onChange={handleChange}
                  min="0"
                  disabled={loading}
                  placeholder="Number of arrests"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="car_plates">Car Plates</label>
              <input
                type="text"
                id="car_plates"
                name="car_plates"
                value={formData.car_plates}
                onChange={handleChange}
                disabled={loading}
                placeholder="License plates (comma separated)"
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                disabled={loading}
                placeholder="Additional details about the event..."
                rows="4"
              />
            </div>

            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                {success}
              </div>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="btn"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Event'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventSubmission;