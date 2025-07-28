import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './EventCard.css';

const EventCard = ({ event, showSubscribeButton = false, onSubscribe }) => {
  const [address, setAddress] = useState('');
  const [addressLoading, setAddressLoading] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Reverse geocode coordinates to get address - prioritize Serbian addresses
  useEffect(() => {
    if (event.latitude && event.longitude) {
      const fetchAddress = async () => {
        setAddressLoading(true);
        try {
          // First try with Serbia country code for better results
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${event.latitude}&lon=${event.longitude}&addressdetails=1&accept-language=sr,en`
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.display_name) {
              // Extract more readable address parts
              const address = data.address || {};
              const parts = [];
              
              // Add house number and road
              if (address.house_number && address.road) {
                parts.push(`${address.house_number} ${address.road}`);
              } else if (address.road) {
                parts.push(address.road);
              }
              
              // Add city/town/village
              if (address.city || address.town || address.village) {
                parts.push(address.city || address.town || address.village);
              }
              
              // Add state/region (for Serbia context)
              if (address.state && address.state !== 'Serbia') {
                parts.push(address.state);
              }
              
              // Always add Serbia if not present and coordinates are in Serbia
              const lat = parseFloat(event.latitude);
              const lng = parseFloat(event.longitude);
              const isInSerbia = (lat >= 42.2 && lat <= 46.2 && lng >= 18.8 && lng <= 23.0);
              
              if (isInSerbia && !data.display_name.toLowerCase().includes('serbia')) {
                parts.push('Serbia');
              }
              
              // Use formatted parts if available, otherwise use full display name
              const formattedAddress = parts.length > 0 
                ? parts.join(', ')
                : data.display_name;
              
              setAddress(formattedAddress);
            } else {
              setAddress(`${event.latitude.toFixed(4)}, ${event.longitude.toFixed(4)}`);
            }
          } else {
            // Fallback to coordinates if API fails
            setAddress(`${event.latitude.toFixed(4)}, ${event.longitude.toFixed(4)}`);
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          // Fallback to coordinates on error
          setAddress(`${event.latitude.toFixed(4)}, ${event.longitude.toFixed(4)}`);
        } finally {
          setAddressLoading(false);
        }
      };

      fetchAddress();
    } else {
      setAddress('Unknown');
    }
  }, [event.latitude, event.longitude]);

  return (
    <div className="card">
      <div className="event-header">
        <h3>Event #{event.id}</h3>
        <span className="event-date">{formatDate(event.time)}</span>
      </div>
      
      <div className="event-details">
        <div className="detail-row">
          <span className="label">Location:</span>
          <span className="value">
            {addressLoading ? (
              <span style={{ color: '#666', fontStyle: 'italic' }}>Loading address...</span>
            ) : (
              address || 'Unknown'
            )}
          </span>
        </div>
        
        {/* Show coordinates as additional info if we have an address */}
        {address && !addressLoading && event.latitude && event.longitude && (
          <div className="detail-row">
            <span className="label">Coordinates:</span>
            <span className="value" style={{ fontSize: '0.9em', color: '#666' }}>
              {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}
            </span>
          </div>
        )}
        
        
        {event.notes && (
          <div className="detail-row">
            <span className="label">Notes:</span>
            <span className="value">{event.notes}</span>
          </div>
        )}
      </div>
      
      <div className="event-actions">
        <Link to={`/events/${event.id}`} className="btn">
          View Details
        </Link>
        
        {showSubscribeButton && (
          <button 
            className="btn btn-secondary"
            onClick={() => onSubscribe(event.id)}
          >
            Subscribe
          </button>
        )}
      </div>
    </div>
  );
};

export default EventCard;