import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const EventMap = ({ 
  events, 
  onEventClick, 
  onLongClick,        // NEW: Function to call on long press
  enableLongClick,    // NEW: Boolean to enable long press
  center = [37.7749, -122.4194], 
  zoom = 12 
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapInstanceRef.current) {
      // Initialize map
      mapInstanceRef.current = L.map(mapRef.current).setView(center, zoom);
      
      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // NEW: Handle long click/right click functionality
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (enableLongClick && onLongClick) {
      const handleLongClick = (e) => {
        // Prevent the default context menu
        e.originalEvent.preventDefault();
        
        // Call the long click handler with coordinates
        onLongClick({
          lat: e.latlng.lat,
          lng: e.latlng.lng
        });
      };

      // Add context menu event listener (right-click on desktop, long press on mobile)
      mapInstanceRef.current.on('contextmenu', handleLongClick);

      // Cleanup function
      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.off('contextmenu', handleLongClick);
        }
      };
    }
  }, [enableLongClick, onLongClick]);

  useEffect(() => {
    if (!mapInstanceRef.current || !events) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Add new markers
    events.forEach(event => {
      if (event.latitude && event.longitude) {
        const marker = L.marker([event.latitude, event.longitude])
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div>
              <h4>Event #${event.id}</h4>
              <p><strong>Time:</strong> ${new Date(event.timestamp).toLocaleString()}</p>
              <p><strong>Police Count:</strong> ${event.police_count || 'Unknown'}</p>
              <p><strong>Arrested:</strong> ${event.arrested_count || 'Unknown'}</p>
              <p><strong>Notes:</strong> ${event.notes || 'No notes'}</p>
              <button onclick="window.viewEvent(${event.id})" class="btn">View Details</button>
            </div>
          `);

        marker.on('click', () => {
          if (onEventClick) {
            onEventClick(event);
          }
        });

        markersRef.current.push(marker);
      }
    });

    // Fit map to show all markers if there are any
    if (markersRef.current.length > 0) {
      const group = new L.featureGroup(markersRef.current);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [events, onEventClick]);

  // Global function for popup buttons
  useEffect(() => {
    window.viewEvent = (eventId) => {
      if (onEventClick) {
        const event = events.find(e => e.id === eventId);
        if (event) {
          onEventClick(event);
        }
      }
    };

    return () => {
      delete window.viewEvent;
    };
  }, [events, onEventClick]);

  return (
    <div 
      ref={mapRef} 
      style={{ 
        height: '400px', 
        width: '100%',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    />
  );
};

export default EventMap;