// ==============================================================================
// SPATIAL MAP COMPONENT
// Description: Interactive Leaflet map supporting dynamic fly-to and click selection
// ==============================================================================

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Helper component to smoothly recenter map when target coordinates change
const MapRecenter = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position && position.length === 2) {
      map.flyTo(position, 12, { animate: true, duration: 1.5 });
    }
  }, [position, map]);
  return null;
};

// Helper component to allow users to select any location by clicking on the map
const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
};

const SpatialMap = ({ centerPosition, mineName, bufferRadius, onMapClick }) => {
  return (
    <div style={{ height: '100%', width: '100%', minHeight: '360px', position: 'relative' }}>
      <MapContainer
        center={centerPosition}
        zoom={12}
        style={{ height: '100%', width: '100%', borderRadius: '8px' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Smooth camera transition on location change */}
        <MapRecenter position={centerPosition} />

        {/* Listen for manual user clicks on the map */}
        <MapClickHandler onLocationSelect={onMapClick} />

        {/* Core Mining Zone (Red Zone) */}
        <Circle
          center={centerPosition}
          pathOptions={{ color: '#dc2626', fillColor: '#ef4444', fillOpacity: 0.35 }}
          radius={bufferRadius * 0.45}
        >
          <Popup>
            <strong>{mineName}</strong><br />
            Core Extraction Zone
          </Popup>
        </Circle>

        {/* Surrounding Green Belt Buffer Zone (Green Outer Ring) */}
        <Circle
          center={centerPosition}
          pathOptions={{ color: '#16a34a', fillColor: '#22c55e', fillOpacity: 0.15, dashArray: '6, 6' }}
          radius={bufferRadius}
        >
          <Popup>
            <strong>{mineName} - Green Belt Buffer</strong><br />
            Monitoring Radius: {(bufferRadius / 1000).toFixed(1)} km
          </Popup>
        </Circle>
      </MapContainer>
    </div>
  );
};

export default SpatialMap;