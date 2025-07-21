import React from 'react';
import { Link } from 'react-router-dom';
import './EventCard.css';

const EventCard = ({ event, showSubscribeButton = false, onSubscribe }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="card">
      <div className="event-header">
        <h3>Event #{event.id}</h3>
        <span className="event-date">{formatDate(event.timestamp)}</span>
      </div>
      
      <div className="event-details">
        <div className="detail-row">
          <span className="label">Location:</span>
          <span className="value">
            {event.latitude && event.longitude 
              ? `${event.latitude.toFixed(4)}, ${event.longitude.toFixed(4)}`
              : 'Unknown'
            }
          </span>
        </div>
        
        <div className="detail-row">
          <span className="label">Police Count:</span>
          <span className="value">{event.police_count || 'Unknown'}</span>
        </div>
        
        <div className="detail-row">
          <span className="label">Arrested Count:</span>
          <span className="value">{event.arrested_count || 'Unknown'}</span>
        </div>
        
        {event.car_plates && (
          <div className="detail-row">
            <span className="label">Car Plates:</span>
            <span className="value">{event.car_plates}</span>
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