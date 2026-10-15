import React from 'react';
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const SpatialMap = () => {
  // Dhanbad/Jharia region coordinates
  const centerPosition = [23.7957, 86.4304];
  const jhariaMiningZone = [23.75, 86.41];

  return (
    <div style={{ height: '100%', width: '100%', minHeight: '350px' }}>
      <MapContainer 
        center={centerPosition} 
        zoom={11} 
        style={{ height: '100%', width: '100%', borderRadius: '4px' }}
      >
        {/* Base Standard Map */}
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Highlighting the Jharia active mining zone */}
        <Circle 
          center={jhariaMiningZone} 
          pathOptions={{ color: 'red', fillColor: '#f03', fillOpacity: 0.4 }} 
          radius={5000} 
        />
      </MapContainer>
    </div>
  );
};

export default SpatialMap;