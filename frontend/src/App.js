// ==============================================================================
// MAIN ENTERPRISE DASHBOARD INTERFACE
// Description: Multi-sensor (1985-2026) environmental monitoring dashboard with
//              exact mine polygons, thermal/dust analytics, jurisdiction-aware
//              compliance advisories (Indian DGMS/MoEFCC vs. Global ICMM/ISO),
//              and before/after pictorial progression.
// ==============================================================================

import React, { useState } from 'react';
import './App.css';
import SpatialMap from './SpatialMap';
import TemporalChart from './TemporalChart';

// Directory of major mining regions (Indian & International) with lease polygons
const KNOWN_MINES = [
  {
    name: 'Jharia Coalfield, Jharkhand',
    countryCode: 'in',
    keywords: ['jharia', 'jhariya', 'dhanbad', 'bccl'],
    coords: [23.7500, 86.4100],
    polygon: [
      [23.805, 86.365],
      [23.812, 86.435],
      [23.775, 86.468],
      [23.715, 86.452],
      [23.698, 86.395],
      [23.742, 86.352]
    ]
  },
  {
    name: 'Korba Coalfield (Gevra), Chhattisgarh',
    countryCode: 'in',
    keywords: ['korba', 'gevra', 'dipka', 'kusmunda', 'secl'],
    coords: [22.3458, 82.5965],
    polygon: [
      [22.382, 82.545],
      [22.390, 82.625],
      [22.348, 82.652],
      [22.305, 82.618],
      [22.312, 82.550]
    ]
  },
  {
    name: 'Singrauli Coalfield, MP / UP',
    countryCode: 'in',
    keywords: ['singrauli', 'singroli', 'nigahi', 'jayant', 'dudhichua', 'ncl'],
    coords: [24.1997, 82.6645],
    polygon: [
      [24.242, 82.615],
      [24.248, 82.705],
      [24.195, 82.728],
      [24.155, 82.685],
      [24.162, 82.612]
    ]
  },
  {
    name: 'Talcher Coalfield, Odisha',
    countryCode: 'in',
    keywords: ['talcher', 'talchar', 'angul', 'mcl'],
    coords: [20.9500, 85.2167],
    polygon: [
      [20.992, 85.165],
      [20.998, 85.255],
      [20.945, 85.272],
      [20.910, 85.225],
      [20.922, 85.162]
    ]
  },
  {
    name: 'Bailadila Iron Ore Mine, Chhattisgarh',
    countryCode: 'in',
    keywords: ['bailadila', 'kirandul', 'bacheli', 'nmdc', 'dantewada'],
    coords: [18.6288, 81.2339],
    polygon: [
      [18.675, 81.205],
      [18.680, 81.258],
      [18.615, 81.265],
      [18.582, 81.225],
      [18.605, 81.195]
    ]
  },
  {
    name: 'Mount Whaleback (Newman), Australia',
    countryCode: 'au',
    keywords: ['newman', 'whaleback', 'pilbara', 'bhp'],
    coords: [-23.3638, 119.6638],
    polygon: [
      [-23.345, 119.635],
      [-23.342, 119.695],
      [-23.378, 119.702],
      [-23.385, 119.645]
    ]
  }
];

const YEAR_OPTIONS = [];
for (let y = 1985; y <= 2026; y++) {
  YEAR_OPTIONS.push(y);
}

const createApproximatePolygon = (lat, lng, radiusMeters) => {
  const latDeg = (radiusMeters * 0.42) / 111320;
  const lngDeg = (radiusMeters * 0.42) / (111320 * Math.cos((lat * Math.PI) / 180));
  const offsets = [
    [1.0, 0.2],
    [0.7, 0.85],
    [0.1, 1.0],
    [-0.75, 0.75],
    [-1.0, -0.15],
    [-0.65, -0.9],
    [0.15, -1.0],
    [0.85, -0.6]
  ];
  return offsets.map(([dLat, dLng]) => [
    Number((lat + dLat * latDeg).toFixed(5)),
    Number((lng + dLng * lngDeg).toFixed(5))
  ]);
};

function App() {
  const [searchMode, setSearchMode] = useState('name');
  const [searchQuery, setSearchQuery] = useState('Jharia Coalfield');
  const [latInput, setLatInput] = useState('23.7500');
  const [lngInput, setLngInput] = useState('86.4100');

  const [startYear, setStartYear] = useState(2005);
  const [endYear, setEndYear] = useState(2024);
  const [bufferRadius, setBufferRadius] = useState(5000);

  const [activeMine, setActiveMine] = useState({
    name: 'Jharia Coalfield, Jharkhand',
    coords: [23.7500, 86.4100],
    polygon: KNOWN_MINES[0].polygon,
    countryCode: 'in'
  });

  const [chartData, setChartData] = useState([]);
  const [mapTileUrl, setMapTileUrl] = useState(null);
  const [pictorialSnapshots, setPictorialSnapshots] = useState([]);
  const [landCover, setLandCover] = useState(null);
  const [statutoryAdvisories, setStatutoryAdvisories] = useState([]);
  const [jurisdiction, setJurisdiction] = useState('INDIA');
  const [frameworkTitle, setFrameworkTitle] = useState(
    'Indian Statutory Compliance & Engineering Advisory (MoEFCC / DGMS / CPCB)'
  );

  const [statusMessage, setStatusMessage] = useState(
    'Ready for multi-sensor spatial analysis (1985-2026). Select any mine or timeframe and click "Analyze Region".'
  );
  const [isLoading, setIsLoading] = useState(false);

  const fetchRealData = async (lat, lng, name, sYear, eYear, radius, polygonCoords, countryCode = null) => {
    if (Number(sYear) >= Number(eYear)) {
      setStatusMessage('Validation Error: Start Year must be earlier than End Year.');
      return;
    }

    setIsLoading(true);
    setStatusMessage(
      `Processing multi-satellite imagery (${sYear}-${eYear}) for ${name}... Computing NDVI, Thermal LST, Dust Proxy, and Pictorial Snapshots.`
    );

    try {
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat,
          lng,
          startYear: sYear,
          endYear: eYear,
          bufferRadius: radius,
          customPolygon: polygonCoords,
          countryCode
        })
      });

      const result = await response.json();

      if (result.status === 'success') {
        setChartData(result.data || []);
        setMapTileUrl(result.mapTileUrl || null);
        setPictorialSnapshots(result.pictorialSnapshots || []);
        setLandCover(result.landCover || null);
        setStatutoryAdvisories(result.statutoryAdvisories || []);
        setJurisdiction(result.jurisdiction || 'INDIA');
        if (result.frameworkTitle) {
          setFrameworkTitle(result.frameworkTitle);
        }

        const badgeText =
          result.jurisdiction === 'INDIA'
            ? 'DGMS/MoEFCC statutory metrics'
            : 'International ICMM/ISO 14001 ESG metrics';

        setStatusMessage(
          `Analysis complete for ${name} (${sYear}-${eYear}). Multi-sensor data and ${badgeText} updated.`
        );
      } else {
        setStatusMessage('Server Error: Failed to process spatial analysis request.');
      }
    } catch (error) {
      console.error(error);
      setStatusMessage(
        'Connection Error: Unable to reach the backend server on port 5000. Ensure "node server.js" is running.'
      );
    }
    setIsLoading(false);
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();

    if (searchMode === 'coords') {
      const parsedLat = parseFloat(latInput);
      const parsedLng = parseFloat(lngInput);
      if (isNaN(parsedLat) || isNaN(parsedLng) || parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
        setStatusMessage('Invalid coordinates entered. Please provide valid Latitude and Longitude values.');
        return;
      }

      const customName = `Custom Mine Site (${parsedLat.toFixed(3)}, ${parsedLng.toFixed(3)})`;
      const approxPoly = createApproximatePolygon(parsedLat, parsedLng, bufferRadius);
      setActiveMine({ name: customName, coords: [parsedLat, parsedLng], polygon: approxPoly, countryCode: null });
      fetchRealData(parsedLat, parsedLng, customName, startYear, endYear, bufferRadius, approxPoly, null);
      return;
    }

    const cleanedQuery = searchQuery.trim().toLowerCase();
    if (!cleanedQuery) return;

    const matchedMine = KNOWN_MINES.find(
      (m) =>
        m.name.toLowerCase().includes(cleanedQuery) ||
        m.keywords.some((kw) => cleanedQuery.includes(kw) || kw.includes(cleanedQuery))
    );

    if (matchedMine) {
      setActiveMine({
        name: matchedMine.name,
        coords: matchedMine.coords,
        polygon: matchedMine.polygon,
        countryCode: matchedMine.countryCode
      });
      setLatInput(String(matchedMine.coords[0]));
      setLngInput(String(matchedMine.coords[1]));
      fetchRealData(
        matchedMine.coords[0],
        matchedMine.coords[1],
        matchedMine.name,
        startYear,
        endYear,
        bufferRadius,
        matchedMine.polygon,
        matchedMine.countryCode
      );
      return;
    }

    try {
      setStatusMessage(`Searching global spatial directory for "${searchQuery}"...`);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
          searchQuery
        )}&limit=1&polygon_geojson=1`
      );
      const results = await response.json();

      if (results && results.length > 0) {
        const foundLat = parseFloat(results[0].lat);
        const foundLng = parseFloat(results[0].lon);
        const displayName = results[0].display_name.split(',').slice(0, 2).join(', ');
        const detectedCountry =
          results[0].address && results[0].address.country_code
            ? results[0].address.country_code
            : null;

        let extractedPoly = null;
        const geojson = results[0].geojson;
        if (geojson && geojson.type === 'Polygon' && geojson.coordinates && geojson.coordinates[0]) {
          const rawRing = geojson.coordinates[0];
          const step = Math.max(1, Math.floor(rawRing.length / 25));
          extractedPoly = rawRing
            .filter((_, idx) => idx % step === 0)
            .map((pt) => [pt[1], pt[0]]);
        } else {
          extractedPoly = createApproximatePolygon(foundLat, foundLng, bufferRadius);
        }

        setActiveMine({
          name: displayName,
          coords: [foundLat, foundLng],
          polygon: extractedPoly,
          countryCode: detectedCountry
        });
        setLatInput(foundLat.toFixed(4));
        setLngInput(foundLng.toFixed(4));
        fetchRealData(
          foundLat,
          foundLng,
          displayName,
          startYear,
          endYear,
          bufferRadius,
          extractedPoly,
          detectedCountry
        );
      } else {
        setStatusMessage(`Could not find a match for "${searchQuery}". Try entering coordinates or clicking on the map.`);
      }
    } catch (error) {
      setStatusMessage('Network issue while querying global geocoding service.');
    }
  };

  const handlePresetSelect = (mine) => {
    setSearchMode('name');
    setSearchQuery(mine.name);
    setLatInput(String(mine.coords[0]));
    setLngInput(String(mine.coords[1]));
    setActiveMine({
      name: mine.name,
      coords: mine.coords,
      polygon: mine.polygon,
      countryCode: mine.countryCode
    });
    fetchRealData(
      mine.coords[0],
      mine.coords[1],
      mine.name,
      startYear,
      endYear,
      bufferRadius,
      mine.polygon,
      mine.countryCode
    );
  };

  const handleMapClick = (lat, lng) => {
    const formattedLat = Number(lat.toFixed(4));
    const formattedLng = Number(lng.toFixed(4));
    setLatInput(String(formattedLat));
    setLngInput(String(formattedLng));
    setSearchMode('coords');

    const clickedName = `Selected Site (${formattedLat}, ${formattedLng})`;
    const approxPoly = createApproximatePolygon(formattedLat, formattedLng, bufferRadius);
    setActiveMine({ name: clickedName, coords: [formattedLat, formattedLng], polygon: approxPoly, countryCode: null });
    fetchRealData(formattedLat, formattedLng, clickedName, startYear, endYear, bufferRadius, approxPoly, null);
  };

  const handleExportCSV = () => {
    if (!chartData || chartData.length === 0) return;
    const headers = ['Year,Mean_NDVI,Surface_Temp_C,Dust_Proxy_Index,Water_Index_NDWI'];
    const rows = chartData.map(
      (row) => `${row.year},${row.ndvi},${row.lst},${row.dust},${row.ndwi}`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeMine.name.split(',')[0].replace(/\s+/g, '_')}_Environmental_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const latestRecord = chartData.length > 0 ? chartData[chartData.length - 1] : null;
  const initialRecord = chartData.length > 0 ? chartData[0] : null;
  const latestNdvi = latestRecord ? latestRecord.ndvi : 0;
  const initialNdvi = initialRecord ? initialRecord.ndvi : 0;
  const percentageChange =
    initialNdvi > 0 ? (((latestNdvi - initialNdvi) / initialNdvi) * 100).toFixed(1) : 0;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-title">
          <h1>Satellite-Based Green Belt & Mine Environment Tracker</h1>
          <p>Multi-Sensor (Landsat 5/7/8 + Sentinel-2) Ecological Reclamation & Statutory Compliance System</p>
        </div>
        <div className="header-actions">
          <span className="header-badge">Coverage: 1985 - 2026 (Multi-Satellite Fusion)</span>
          {chartData.length > 0 && (
            <>
              <button type="button" className="export-btn" onClick={handleExportCSV}>
                Export CSV Data
              </button>
              <button type="button" className="export-btn" onClick={() => window.print()}>
                Print Statutory Report
              </button>
            </>
          )}
        </div>
      </header>

      <form className="control-bar" onSubmit={handleAnalyze}>
        <div className="search-mode-toggle">
          <button
            type="button"
            className={`toggle-btn ${searchMode === 'name' ? 'active' : ''}`}
            onClick={() => setSearchMode('name')}
          >
            Mine Name
          </button>
          <button
            type="button"
            className={`toggle-btn ${searchMode === 'coords' ? 'active' : ''}`}
            onClick={() => setSearchMode('coords')}
          >
            Coordinates
          </button>
        </div>

        {searchMode === 'name' ? (
          <div className="input-group" style={{ flex: 2 }}>
            <label>Search Mine or Coalfield Name (Global)</label>
            <input
              type="text"
              placeholder="e.g., Jharia, Korba, Singrauli, Mount Whaleback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        ) : (
          <div className="coord-inputs">
            <div className="input-group">
              <label>Latitude</label>
              <input
                type="number"
                step="any"
                value={latInput}
                onChange={(e) => setLatInput(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Longitude</label>
              <input
                type="number"
                step="any"
                value={lngInput}
                onChange={(e) => setLngInput(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="input-group" style={{ maxWidth: '130px' }}>
          <label>Start Year (1985+)</label>
          <select value={startYear} onChange={(e) => setStartYear(Number(e.target.value))}>
            {YEAR_OPTIONS.slice(0, -1).map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>

        <div className="input-group" style={{ maxWidth: '130px' }}>
          <label>End Year</label>
          <select value={endYear} onChange={(e) => setEndYear(Number(e.target.value))}>
            {YEAR_OPTIONS.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>

        <div className="input-group" style={{ maxWidth: '150px' }}>
          <label>Buffer Radius</label>
          <select value={bufferRadius} onChange={(e) => setBufferRadius(Number(e.target.value))}>
            <option value={3000}>3.0 km</option>
            <option value={5000}>5.0 km</option>
            <option value={8000}>8.0 km</option>
            <option value={12000}>12.0 km</option>
          </select>
        </div>

        <button
          type="submit"
          className="analyze-btn"
          disabled={isLoading}
          style={{ opacity: isLoading ? 0.7 : 1 }}
        >
          {isLoading ? 'Processing GEE...' : 'Analyze Region'}
        </button>

        <div className="quick-presets">
          <span>Quick Select Mine:</span>
          {KNOWN_MINES.map((mine, idx) => (
            <button
              key={idx}
              type="button"
              className="preset-chip"
              onClick={() => handlePresetSelect(mine)}
            >
              {mine.name.split(',')[0]}
            </button>
          ))}
        </div>
      </form>

      <div className="status-banner">{statusMessage}</div>

      <section className="kpi-row">
        <div className="kpi-card">
          <div className="kpi-label">Latest Mean NDVI ({endYear})</div>
          <div className="kpi-value">{latestRecord ? latestNdvi : '--'}</div>
          <div className="kpi-subtext">
            {landCover ? `Dense Canopy: ${landCover.denseCanopyPct}% of buffer` : 'Scale: -1.0 to +1.0'}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Green Cover Change ({startYear}-{endYear})</div>
          <div
            className="kpi-value"
            style={{ color: percentageChange >= 0 ? '#16a34a' : '#dc2626' }}
          >
            {chartData.length > 0
              ? percentageChange >= 0
                ? `+${percentageChange}%`
                : `${percentageChange}%`
              : '--'}
          </div>
          <div className="kpi-subtext">Long-term reclamation trajectory</div>
        </div>

        <div className="kpi-card thermal">
          <div className="kpi-label">Surface Temp (LST {endYear})</div>
          <div className="kpi-value">{latestRecord ? `${latestRecord.lst} °C` : '--'}</div>
          <div className="kpi-subtext">Satellite thermal infrared band</div>
        </div>

        <div className="kpi-card dust">
          <div className="kpi-label">Particulate / Dust Proxy</div>
          <div className="kpi-value">{latestRecord ? latestRecord.dust : '--'}</div>
          <div className="kpi-subtext">SWIR/NIR surface dust reflectance</div>
        </div>

        <div className="kpi-card carbon">
          <div className="kpi-label">Estimated Carbon Sink</div>
          <div className="kpi-value">
            {landCover ? `${landCover.co2TonnesPerYear.toLocaleString()} t/yr` : '--'}
          </div>
          <div className="kpi-subtext">
            {landCover ? `Across ${landCover.greenBeltAreaHa} ha vegetated zone` : 'Annual CO2 sequestration'}
          </div>
        </div>
      </section>

      <main className="dashboard-content">
        <section className="panel">
          <div className="panel-header">
            <h2>Spatial Boundary & Live NDVI Layer: {activeMine.name}</h2>
            <span className="coord-tag">
              Lat: {activeMine.coords[0].toFixed(4)}, Lng: {activeMine.coords[1].toFixed(4)}
            </span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <SpatialMap
              centerPosition={activeMine.coords}
              mineName={activeMine.name}
              bufferRadius={bufferRadius}
              minePolygon={activeMine.polygon}
              mapTileUrl={mapTileUrl}
              onMapClick={handleMapClick}
            />
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Multi-Parameter Historical Trend ({startYear}-{endYear})</h2>
            <span className="coord-tag">Click tabs below to switch parameter</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {chartData.length > 0 ? (
              <TemporalChart chartData={chartData} jurisdiction={jurisdiction} />
            ) : (
              <div className="placeholder-box">
                {isLoading
                  ? 'Harmonizing multi-satellite data from Google Earth Engine...'
                  : 'Select any mine or timeframe above and click "Analyze Region" to generate multi-year trends.'}
              </div>
            )}
          </div>
        </section>
      </main>

      {landCover && (
        <section className="secondary-grid">
          <div className="land-cover-card">
            <div className="panel-header">
              <h2>Land Cover Distribution ({endYear})</h2>
              <span className="coord-tag">Total Area: {landCover.totalAreaHa.toLocaleString()} ha</span>
            </div>

            <div className="land-bar-group">
              <div className="land-bar-item">
                <div className="land-bar-label">
                  <span>Dense Green Belt Canopy (NDVI &ge; 0.40)</span>
                  <span style={{ color: '#15803d' }}>{landCover.denseCanopyPct}%</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${landCover.denseCanopyPct}%`, background: '#16a34a' }}
                  ></div>
                </div>
              </div>

              <div className="land-bar-item">
                <div className="land-bar-label">
                  <span>Shrubs / Early Reclamation (0.20 &le; NDVI &lt; 0.40)</span>
                  <span style={{ color: '#65a30d' }}>{landCover.shrubReclaimedPct}%</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${landCover.shrubReclaimedPct}%`, background: '#84cc16' }}
                  ></div>
                </div>
              </div>

              <div className="land-bar-item">
                <div className="land-bar-label">
                  <span>Active Mining Pit / Overburden / Water (NDVI &lt; 0.20)</span>
                  <span style={{ color: '#dc2626' }}>{landCover.barrenPitPct}%</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${landCover.barrenPitPct}%`, background: '#ef4444' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="statutory-card">
            <div className="panel-header">
              <h2>{frameworkTitle}</h2>
              <span className="coord-tag">
                {jurisdiction === 'INDIA' ? 'Jurisdiction: India' : 'Jurisdiction: International ESG'}
              </span>
            </div>

            <div className="advisory-list">
              {statutoryAdvisories.map((adv, index) => (
                <div key={index} className={`advisory-item ${adv.severity}`}>
                  <div className="advisory-top">
                    <span>{adv.authority}</span>
                    <span className="advisory-badge">{adv.status}</span>
                  </div>
                  <p className="advisory-detail">{adv.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {pictorialSnapshots.length > 0 && (
        <section className="pictorial-section">
          <div className="panel-header">
            <h2>
              Spatio-Temporal Pictorial Progression ({startYear} &rarr; {endYear})
            </h2>
            <span className="coord-tag">
              Red/Orange: Active Pit &amp; Barren | Light Green: Reclamation | Dark Green: Dense Canopy
            </span>
          </div>

          <div className="snapshots-grid">
            {pictorialSnapshots.map((snap, idx) => (
              <div key={idx} className="snapshot-card">
                <div className="snapshot-img-box">
                  <img src={snap.thumbUrl} alt={`NDVI Snapshot ${snap.year}`} />
                </div>
                <div className="snapshot-info">
                  <div>
                    <div className="snapshot-stage">{snap.stage}</div>
                    <div className="snapshot-year">Year {snap.year}</div>
                  </div>
                  <div className="snapshot-ndvi-pill">Mean NDVI: {snap.meanNdvi}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default App;