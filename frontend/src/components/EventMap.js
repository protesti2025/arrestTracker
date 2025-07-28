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
  center = [44.0, 21.0],  // Serbia center coordinates
  zoom = 6             // Zoom level to show whole Serbia
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    // Only initialize once, regardless of prop changes
    if (!mapInstanceRef.current && mapRef.current) {
      try {
        // Initialize map with strict settings to prevent world repetition
        mapInstanceRef.current = L.map(mapRef.current, {
          worldCopyJump: false,
          maxBounds: [[-90, -180], [90, 180]],
          maxBoundsViscosity: 1.0,
          minZoom: 3, // Prevent zooming out too far to see multiple worlds
          maxZoom: 18
        }).setView(center, zoom);
        
        // Add tile layer with strict bounds
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          noWrap: true,
          bounds: [[-90, -180], [90, 180]],
          maxZoom: 18
        }).addTo(mapInstanceRef.current);
      } catch (error) {
        console.error('Map initialization error:', error);
      }
    }

    return () => {
      // Improved cleanup
      if (mapInstanceRef.current) {
        try {
          // Clear all markers first
          markersRef.current.forEach(marker => {
            if (mapInstanceRef.current && marker) {
              mapInstanceRef.current.removeLayer(marker);
            }
          });
          markersRef.current = [];
          
          // Remove map instance
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        } catch (error) {
          console.error('Map cleanup error:', error);
          mapInstanceRef.current = null;
        }
      }
    };
  }, []); // Remove dependencies to prevent re-initialization

  // Handle center and zoom changes without re-initializing the map
  useEffect(() => {
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.setView(center, zoom);
      } catch (error) {
        console.error('Map view update error:', error);
      }
    }
  }, [center, zoom]);

  // NEW: Handle long click/right click functionality
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (enableLongClick && onLongClick) {
      let longPressTimer;
      let touchStartPos;
      let isLongPress = false;

      // Desktop right-click handler
      const handleContextMenu = (e) => {
        e.originalEvent.preventDefault();
        onLongClick({
          lat: e.latlng.lat,
          lng: e.latlng.lng
        });
      };

      // Mobile touch handlers
      const handleTouchStart = (e) => {
        isLongPress = false;
        touchStartPos = e.latlng;
        
        longPressTimer = setTimeout(() => {
          isLongPress = true;
          // Trigger haptic feedback if available
          if (navigator.vibrate) {
            navigator.vibrate(50);
          }
          onLongClick({
            lat: e.latlng.lat,
            lng: e.latlng.lng
          });
        }, 500); // 500ms long press
      };

      const handleTouchEnd = (e) => {
        clearTimeout(longPressTimer);
        
        // Prevent normal click if it was a long press
        if (isLongPress) {
          e.originalEvent.preventDefault();
          e.originalEvent.stopPropagation();
        }
      };

      const handleTouchMove = (e) => {
        // Cancel long press if user moves finger too much
        if (touchStartPos && e.latlng) {
          const distance = mapInstanceRef.current.distance(touchStartPos, e.latlng);
          if (distance > 20) { // 20 meters tolerance
            clearTimeout(longPressTimer);
          }
        }
      };

      // Add event listeners
      mapInstanceRef.current.on('contextmenu', handleContextMenu);
      mapInstanceRef.current.on('mousedown', handleTouchStart);
      mapInstanceRef.current.on('mouseup', handleTouchEnd);
      mapInstanceRef.current.on('mousemove', handleTouchMove);

      // Add CSS to prevent text selection and context menu
      const mapElement = mapRef.current;
      if (mapElement) {
        mapElement.style.userSelect = 'none';
        mapElement.style.webkitUserSelect = 'none';
        mapElement.style.webkitTouchCallout = 'none';
      }

      // Cleanup function
      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.off('contextmenu', handleContextMenu);
          mapInstanceRef.current.off('mousedown', handleTouchStart);
          mapInstanceRef.current.off('mouseup', handleTouchEnd);
          mapInstanceRef.current.off('mousemove', handleTouchMove);
        }
        clearTimeout(longPressTimer);
        
        if (mapElement) {
          mapElement.style.userSelect = '';
          mapElement.style.webkitUserSelect = '';
          mapElement.style.webkitTouchCallout = '';
        }
      };
    }
  }, [enableLongClick, onLongClick]);

  useEffect(() => {
    if (!mapInstanceRef.current || !events) return;

    try {
      // Clear existing markers safely
      markersRef.current.forEach(marker => {
        try {
          if (mapInstanceRef.current && marker) {
            mapInstanceRef.current.removeLayer(marker);
          }
        } catch (error) {
          console.error('Error removing marker:', error);
        }
      });
      markersRef.current = [];

      // Add new markers with error handling
      events.forEach(event => {
        if (event.latitude && event.longitude) {
          // Ensure coordinates are numbers
          const lat = parseFloat(event.latitude);
          const lng = parseFloat(event.longitude);
          
          if (!isNaN(lat) && !isNaN(lng)) {
            try {
              const marker = L.marker([lat, lng])
                .addTo(mapInstanceRef.current)
                .bindPopup(`
                  <div>
                    <h4>Event #${event.id}</h4>
                    <p><strong>Time:</strong> ${new Date(event.time || event.timestamp).toLocaleString()}</p>
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
            } catch (error) {
              console.error('Error creating marker for event', event.id, error);
            }
          }
        }
      });

      // Keep Serbia view - don't auto-fit to markers, stay centered on Serbia
      // Only auto-fit if explicitly requested or if center is not Serbia
      const isSerbiaCentered = (center[0] === 44.0 && center[1] === 21.0);
      if (markersRef.current.length > 0 && !isSerbiaCentered) {
        try {
          const group = new L.featureGroup(markersRef.current);
          mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
        } catch (error) {
          console.error('Error fitting bounds:', error);
        }
      }
    } catch (error) {
      console.error('Error updating markers:', error);
    }
  }, [events, onEventClick, center]);

  // Global function for popup buttons - with error handling
  useEffect(() => {
    window.viewEvent = (eventId) => {
      try {
        if (onEventClick && events) {
          const event = events.find(e => e.id === eventId);
          if (event) {
            onEventClick(event);
          }
        }
      } catch (error) {
        console.error('Error in viewEvent:', error);
      }
    };

    return () => {
      try {
        delete window.viewEvent;
      } catch (error) {
        console.error('Error cleaning up viewEvent:', error);
      }
    };
  }, [events, onEventClick]);

  return (
    <div 
      ref={mapRef} 
      key="leaflet-map" // Stable key to prevent re-renders
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