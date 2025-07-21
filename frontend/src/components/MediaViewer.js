import React, { useState, useEffect } from 'react';
import { mediaAPI } from '../services/api';
import { useAuth } from '../services/AuthContext';
import './MediaViewer.css';

const MediaViewer = ({ eventId }) => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAdvocate } = useAuth();

  useEffect(() => {
    loadMedia();
  }, [eventId]);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const response = await mediaAPI.getEventMedia(eventId);
      setMedia(response.data);
    } catch (error) {
      console.error('Error loading media:', error);
      setError('Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMedia = async (mediaId) => {
    if (!window.confirm('Are you sure you want to delete this media?')) {
      return;
    }

    try {
      await mediaAPI.deleteMedia(eventId, mediaId);
      setMedia(media.filter(m => m.id !== mediaId));
    } catch (error) {
      console.error('Error deleting media:', error);
      setError('Failed to delete media');
    }
  };

  if (!isAdvocate) {
    return (
      <div className="alert alert-info">
        Media viewing is restricted to advocates only.
      </div>
    );
  }

  if (loading) {
    return <div className="loading">Loading media...</div>;
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  if (media.length === 0) {
    return (
      <div className="alert alert-info">
        No media files uploaded for this event.
      </div>
    );
  }

  return (
    <div className="media-viewer">
      <h3>Event Media ({media.length})</h3>
      <div className="media-grid">
        {media.map((item) => (
          <div key={item.id} className="media-item">
            <div className="media-content">
              {item.type === 'photo' ? (
                <img 
                  src={item.url} 
                  alt={`Evidence ${item.id}`}
                  className="media-preview"
                />
              ) : (
                <video 
                  src={item.url} 
                  controls 
                  className="media-preview"
                />
              )}
            </div>
            <div className="media-info">
              <p><strong>Type:</strong> {item.type}</p>
              <p><strong>Uploaded:</strong> {new Date(item.uploaded_at).toLocaleString()}</p>
              <p><strong>Size:</strong> {item.file_size ? `${(item.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}</p>
            </div>
            <div className="media-actions">
              <a 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                View Full Size
              </a>
              <button 
                onClick={() => handleDeleteMedia(item.id)}
                className="btn btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MediaViewer;