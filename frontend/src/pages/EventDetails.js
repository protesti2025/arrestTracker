import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsAPI, witnessAPI } from '../services/api';
import { useAuth } from '../services/AuthContext';
import MediaUpload from '../components/MediaUpload';
import MediaViewer from '../components/MediaViewer';
import EventMap from '../components/EventMap';
import './EventDetails.css';

const EventDetails = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [witnessMessage, setWitnessMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSuccess, setMessageSuccess] = useState('');
  const { user, isSpotter, isAdvocate } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getEventById(id);
      setEvent(response.data);
      // Check if user is subscribed (you might want to add this to the API)
      setSubscribed(response.data.subscribed || false);
    } catch (error) {
      console.error('Error loading event:', error);
      setError('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      if (subscribed) {
        await eventsAPI.unsubscribeFromEvent(id);
        setSubscribed(false);
        alert('Unsubscribed from event notifications');
      } else {
        await eventsAPI.subscribeToEvent(id);
        setSubscribed(true);
        alert('Subscribed to event notifications');
      }
    } catch (error) {
      console.error('Subscribe error:', error);
      alert('Failed to update subscription');
    }
  };

  const handleContactWitnesses = async (e) => {
    e.preventDefault();
    
    if (!witnessMessage.trim()) {
      alert('Please enter a message');
      return;
    }

    try {
      setSendingMessage(true);
      await witnessAPI.contactWitnesses(id, witnessMessage);
      setMessageSuccess('Message sent to witnesses successfully!');
      setWitnessMessage('');
    } catch (error) {
      console.error('Contact witnesses error:', error);
      alert('Failed to send message to witnesses');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleMediaUploadComplete = () => {
    // Refresh the page to show new media
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading event details...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container">
        <div className="alert alert-error">
          {error || 'Event not found'}
        </div>
        <button onClick={() => navigate('/dashboard')} className="btn">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="main-content">
        <div className="event-details-header">
          <h1 className="page-title">Event #{event.id}</h1>
          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
            Back to Dashboard
          </button>
        </div>

        <div className="event-details-content">
          <div className="event-info-section">
            <div className="card">
              <h2>Event Information</h2>
              <div className="event-details-grid">
                <div className="detail-item">
                  <span className="label">Timestamp:</span>
                  <span className="value">{new Date(event.timestamp).toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Location:</span>
                  <span className="value">
                    {event.latitude && event.longitude 
                      ? `${event.latitude.toFixed(6)}, ${event.longitude.toFixed(6)}`
                      : 'Unknown'
                    }
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Police Count:</span>
                  <span className="value">{event.police_count || 'Unknown'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Arrested Count:</span>
                  <span className="value">{event.arrested_count || 'Unknown'}</span>
                </div>
                {event.car_plates && (
                  <div className="detail-item">
                    <span className="label">Car Plates:</span>
                    <span className="value">{event.car_plates}</span>
                  </div>
                )}
                {event.notes && (
                  <div className="detail-item full-width">
                    <span className="label">Notes:</span>
                    <span className="value">{event.notes}</span>
                  </div>
                )}
              </div>

              {isSpotter && (
                <div className="event-actions">
                  <button 
                    onClick={handleSubscribe}
                    className={`btn ${subscribed ? 'btn-secondary' : ''}`}
                  >
                    {subscribed ? 'Unsubscribe' : 'Subscribe to Updates'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {event.latitude && event.longitude && (
            <div className="event-map-section">
              <div className="card">
                <h2>Location</h2>
                <EventMap 
                  events={[event]}
                  center={[event.latitude, event.longitude]}
                  zoom={15}
                />
              </div>
            </div>
          )}

          {isSpotter && (
            <div className="media-upload-section">
              <MediaUpload 
                eventId={id}
                onUploadComplete={handleMediaUploadComplete}
              />
            </div>
          )}

          <div className="media-viewer-section">
            <MediaViewer eventId={id} />
          </div>

          {isAdvocate && (
            <div className="witness-contact-section">
              <div className="card">
                <h2>Contact Witnesses</h2>
                <form onSubmit={handleContactWitnesses}>
                  <div className="form-group">
                    <label htmlFor="message">Message to Witnesses:</label>
                    <textarea
                      id="message"
                      value={witnessMessage}
                      onChange={(e) => setWitnessMessage(e.target.value)}
                      placeholder="Enter your message to witnesses..."
                      rows="4"
                      disabled={sendingMessage}
                    />
                  </div>

                  {messageSuccess && (
                    <div className="alert alert-success">
                      {messageSuccess}
                    </div>
                  )}

                  <button 
                    type="submit"
                    className="btn"
                    disabled={sendingMessage || !witnessMessage.trim()}
                  >
                    {sendingMessage ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetails;