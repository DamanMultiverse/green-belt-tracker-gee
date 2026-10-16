// ==============================================================================
// SPATIAL MAP COMPONENT (POLYGON BOUNDARIES & LIVE GEE OVERLAY)
// Description: Interactive Leaflet map supporting exact mine lease polygons,
//              buffer rings, live GEE NDVI raster tiles, and satellite basemaps.
// ==============================================================================

import React, { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Circle,
  Polygon,
  Popup,
  useMap,
  useMapEvents
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Smoothly fly to new coordinates when the active mine changes
const MapRecenter = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position && position.length === 2) {
      map.flyTo(position, 12, { animate: true, duration: 1.5 });
    }
  }, [position, map]);
  return null;
};

// Capture manual user clicks on the map for custom coordinate selection
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

const SpatialMap = ({
  centerPosition,
  mineName,
  bufferRadius,
  minePolygon,
  mapTileUrl,
  onMapClick
}) => {
  const [baseLayer, setBaseLayer] = useState('satellite');
  const [showGeeOverlay, setShowGeeOverlay] = useState(true);
  const [overlayOpacity, setOverlayOpacity] = useState(0.75);

  return (
    <div className="map-wrapper">
      {/* Floating Map Layer Controls */}
      <div className="map-layer-controls">
        <div className="layer-toggle-group">
          <button
            type="button"
            className={`map-ctrl-btn ${baseLayer === 'street' ? 'active' : ''}`}
            onClick={() => setBaseLayer('street')}
          >
            Street Map
          </button>
          <button
            type="button"
            className={`map-ctrl-btn ${baseLayer === 'satellite' ? 'active' : ''}`}
            onClick={() => setBaseLayer('satellite')}
          >
            Satellite View
          </button>
        </div>

        {mapTileUrl && (
          <div className="gee-overlay-controls">
            <label className="overlay-checkbox">
              <input
                type="checkbox"
                checked={showGeeOverlay}
                onChange={(e) => setShowGeeOverlay(e.target.checked)}
              />
              <span>Live GEE NDVI Layer</span>
            </label>
            {showGeeOverlay && (
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity( parseFloat(e.target.value) )}
                title="Adjust NDVI Layer Opacity"
                className="opacity-slider"
              />
            )}
          </div>
        )}
      </div>

      <MapContainer
        center={centerPosition}
        zoom={12}
        style={{ height: '100%', width: '100%', minHeight: '400px', borderRadius: '8px' }}
      >
        {/* Base Map Tile Layer (Street vs Satellite) */}
        {baseLayer === 'street' ? (
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        ) : (
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        )}

        {/* Live Google Earth Engine NDVI Raster Tile Layer */}
        {mapTileUrl && showGeeOverlay && (
          <TileLayer
            url={mapTileUrl}
            opacity={overlayOpacity}
            attribution="Google Earth Engine (Sentinel-2 / Landsat)"
          />
        )}

        <MapRecenter position={centerPosition} />
        <MapClickHandler onLocationSelect={onMapClick} />

        {/* Exact Mine Lease Boundary Polygon (if available) or Core Pit Circle */}
        {minePolygon && minePolygon.length >= 3 ? (
          <Polygon
            positions={minePolygon}
            pathOptions={{
              color: '#ef4444',
              weight: 3,
              fillColor: '#dc2626',
              fillOpacity: showGeeOverlay && mapTileUrl ? 0.08 : 0.28
            }}
          >
            <Popup>
              <strong>{mineName}</strong>
              <br />
              Demarcated Core Mining Lease Boundary
            </Popup>
          </Polygon>
        ) : (
          <Circle
            center={centerPosition}
            pathOptions={{
              color: '#ef4444',
              weight: 2,
              fillColor: '#dc2626',
              fillOpacity: showGeeOverlay && mapTileUrl ? 0.08 : 0.28
            }}
            radius={bufferRadius * 0.4}
          >
            <Popup>
              <strong>{mineName}</strong>
              <br />
              Core Extraction Zone
            </Popup>
          </Circle>
        )}

        {/* Outer Statutory Green Belt Buffer Zone */}
        <Circle
          center={centerPosition}
          pathOptions={{
            color: '#22c55e',
            weight: 2.5,
            fillColor: '#16a34a',
            fillOpacity: 0.05,
            dashArray: '8, 6'
          }}
          radius={bufferRadius}
        >
          <Popup>
            <strong>{mineName} - Statutory Buffer Zone</strong>
            <br />
            Monitoring Radius: {(bufferRadius / 1000).toFixed(1)} km
          </Popup>
        </Circle>
      </MapContainer>

      {/* Bottom Map Legend */}
      <div className="map-legend-bar">
        <span className="legend-item">
          <span className="legend-Swatch" style={{ background: '#d73027' }}></span> Active Pit / Water
        </span>
        <span className="legend-item">
          <span className="legend-Swatch" style={{ background: '#fee08b' }}></span> Barren / Overburden
        </span>
        <span className="legend-item">
          <span className="legend-Swatch" style={{ background: '#91cf60' }}></span> Shrubs / Reclamation
        </span>
        <span className="legend-item">
          <span className="legend-Swatch" style={{ background: '#1a9850' }}></span> Dense Green Belt
        </span>
        <span className="legend-item">
          <span className="legend-border-red"></span> Mine Boundary
        </span>
      </div>
    </div>
  );
};

export default SpatialMap;