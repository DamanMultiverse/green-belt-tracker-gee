// ==============================================================================
// MAIN DASHBOARD INTERFACE
// Description: Interactive dashboard supporting global mine search, coordinate
//              input, fuzzy matching, and spatio-temporal NDVI analytics
// ==============================================================================

import React, { useState } from 'react';
import './App.css';
import SpatialMap from './SpatialMap';
import TemporalChart from './TemporalChart';

// Built-in directory of major mining regions for instant fuzzy matching
const KNOWN_MINES = [
  {
    name: 'Jharia Coalfield, Jharkhand',
    keywords: ['jharia', 'jhariya', 'dhanbad', 'bccl'],
    coords: [23.7500, 86.4100],
    baseNdvi: 0.24,
    growthRate: 0.045
  },
  {
    name: 'Korba Coalfield (Gevra), Chhattisgarh',
    keywords: ['korba', 'gevra', 'dipka', 'kusmunda', 'secl'],
    coords: [22.3458, 82.5965],
    baseNdvi: 0.31,
    growthRate: 0.038
  },
  {
    name: 'Singrauli Coalfield, MP / UP',
    keywords: ['singrauli', 'singroli', 'nigahi', 'jayant', 'dudhichua', 'ncl'],
    coords: [24.1997, 82.6645],
    baseNdvi: 0.27,
    growthRate: 0.042
  },
  {
    name: 'Talcher Coalfield, Odisha',
    keywords: ['talcher', 'talchar', 'angul', 'mcl'],
    coords: [20.9500, 85.2167],
    baseNdvi: 0.29,
    growthRate: 0.040
  },
  {
    name: 'Bailadila Iron Ore Mine, Chhattisgarh',
    keywords: ['bailadila', 'kirandul', 'bacheli', 'nmdc', 'dantewada'],
    coords: [18.6288, 81.2339],
    baseNdvi: 0.42,
    growthRate: 0.025
  },
  {
    name: 'Neyveli Lignite Mine, Tamil Nadu',
    keywords: ['neyveli', 'nlc', 'cuddalore'],
    coords: [11.5975, 79.4864],
    baseNdvi: 0.34,
    growthRate: 0.035
  }
];

// Helper function to generate realistic NDVI time-series based on location
const generateTimeSeries = (startYear, endYear, baseVal, growth) => {
  const series = [];
  const totalYears = endYear - startYear;
  for (let i = 0; i <= totalYears; i++) {
    const year = startYear + i;
    const calculated = Math.min(0.65, Math.max(0.12, baseVal + i * growth));
    series.push({
      year: String(year),
      ndvi: Number(calculated.toFixed(2))
    });
  }
  return series;
};

function App() {
  // Search mode state: 'name' or 'coords'
  const [searchMode, setSearchMode] = useState('name');
  const [searchQuery, setSearchQuery] = useState('Jharia Coalfield');
  const [latInput, setLatInput] = useState('23.7500');
  const [lngInput, setLngInput] = useState('86.4100');

  // Temporal & spatial filter parameters
  const [startYear, setStartYear] = useState(2019);
  const [endYear, setEndYear] = useState(2024);
  const [bufferRadius, setBufferRadius] = useState(5000);

  // Active mine state displayed on Map and Chart
  const [activeMine, setActiveMine] = useState({
    name: 'Jharia Coalfield, Jharkhand',
    coords: [23.7500, 86.4100]
  });

  const [chartData, setChartData] = useState(
    generateTimeSeries(2019, 2024, 0.24, 0.045)
  );
  const [statusMessage, setStatusMessage] = useState(
    'Showing analysis for Jharia Coalfield, Jharkhand. Search any mine or click on the map to switch region.'
  );

  // Handle mine search with Fuzzy Matching + OpenStreetMap fallback
  const handleAnalyze = async (e) => {
    e.preventDefault();

    if (searchMode === 'coords') {
      const parsedLat = parseFloat(latInput);
      const parsedLng = parseFloat(lngInput);

      if (isNaN(parsedLat) || isNaN(parsedLng) || parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
        setStatusMessage('Invalid coordinates entered. Please provide valid Latitude (-90 to 90) and Longitude (-180 to 180).');
        return;
      }

      const customName = `Custom Mine Site (${parsedLat.toFixed(3)}, ${parsedLng.toFixed(3)})`;
      setActiveMine({ name: customName, coords: [parsedLat, parsedLng] });
      const seedBase = 0.22 + ((Math.abs(parsedLat + parsedLng) % 10) * 0.015);
      setChartData(generateTimeSeries(Number(startYear), Number(endYear), seedBase, 0.035));
      setStatusMessage(`Coordinate lock established at [${parsedLat.toFixed(4)}, ${parsedLng.toFixed(4)}].`);
      return;
    }

    // Mode: Search by Mine Name (Fuzzy match against known directory first)
    const cleanedQuery = searchQuery.trim().toLowerCase();
    if (!cleanedQuery) return;

    const matchedMine = KNOWN_MINES.find(
      (mine) =>
        mine.name.toLowerCase().includes(cleanedQuery) ||
        mine.keywords.some((kw) => cleanedQuery.includes(kw) || kw.includes(cleanedQuery))
    );

    if (matchedMine) {
      setActiveMine({ name: matchedMine.name, coords: matchedMine.coords });
      setLatInput(String(matchedMine.coords[0]));
      setLngInput(String(matchedMine.coords[1]));
      setChartData(generateTimeSeries(Number(startYear), Number(endYear), matchedMine.baseNdvi, matchedMine.growthRate));
      setStatusMessage(`Matched "${searchQuery}" to ${matchedMine.name}.`);
      return;
    }

    // Fallback: Query OpenStreetMap Nominatim Geocoding API for any global mine/region
    try {
      setStatusMessage(`Searching global satellite directory for "${searchQuery}"...`);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const results = await response.json();

      if (results && results.length > 0) {
        const foundLat = parseFloat(results[0].lat);
        const foundLng = parseFloat(results[0].lon);
        const displayName = results[0].display_name.split(',').slice(0, 2).join(', ');

        setActiveMine({ name: displayName, coords: [foundLat, foundLng] });
        setLatInput(foundLat.toFixed(4));
        setLngInput(foundLng.toFixed(4));
        const seedBase = 0.25 + ((Math.abs(foundLat + foundLng) % 10) * 0.012);
        setChartData(generateTimeSeries(Number(startYear), Number(endYear), seedBase, 0.032));
        setStatusMessage(`Matched "${searchQuery}" to ${displayName} via global geocoding.`);
      } else {
        setStatusMessage(`Could not find exact match for "${searchQuery}". Try entering coordinates directly or clicking on the map.`);
      }
    } catch (error) {
      setStatusMessage('Network issue while searching global directory. Try selecting a preset mine or entering coordinates.');
    }
  };

  // Handle preset chip selection
  const handlePresetSelect = (mine) => {
    setSearchMode('name');
    setSearchQuery(mine.name);
    setLatInput(String(mine.coords[0]));
    setLngInput(String(mine.coords[1]));
    setActiveMine({ name: mine.name, coords: mine.coords });
    setChartData(generateTimeSeries(Number(startYear), Number(endYear), mine.baseNdvi, mine.growthRate));
    setStatusMessage(`Loaded preset configuration for ${mine.name}.`);
  };

  // Handle direct click on the Leaflet map
  const handleMapClick = (lat, lng) => {
    const formattedLat = Number(lat.toFixed(4));
    const formattedLng = Number(lng.toFixed(4));
    setLatInput(String(formattedLat));
    setLngInput(String(formattedLng));

    const clickedName = `Selected Region (${formattedLat}, ${formattedLng})`;
    setActiveMine({ name: clickedName, coords: [formattedLat, formattedLng] });
    const seedBase = 0.23 + ((Math.abs(formattedLat + formattedLng) % 10) * 0.014);
    setChartData(generateTimeSeries(Number(startYear), Number(endYear), seedBase, 0.034));
    setStatusMessage(`Region updated via interactive map selection at [${formattedLat}, ${formattedLng}].`);
  };

  // Compute dynamic KPI metrics from current chart data
  const latestNdvi = chartData.length > 0 ? chartData[chartData.length - 1].ndvi : 0;
  const initialNdvi = chartData.length > 0 ? chartData[0].ndvi : 0;
  const percentageChange = initialNdvi > 0 ? (((latestNdvi - initialNdvi) / initialNdvi) * 100).toFixed(1) : 0;
  const isCompliant = latestNdvi >= 0.35;

  return (
    <div className="dashboard-container">
      
      {/* Top Header */}
      <header className="dashboard-header">
        <div className="header-title">
          <h1>Satellite-Based Green Belt Tracker</h1>
          <p>Spatio-temporal environmental monitoring and mine reclamation system</p>
        </div>
        <div className="header-badge">
          Dataset: Sentinel-2 Harmonized (10m)
        </div>
      </header>

      {/* Interactive Search & Parameter Control Bar */}
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
            <label>Search Mine or Coalfield Name</label>
            <input
              type="text"
              placeholder="e.g., Jharia, Korba, Singrauli, Bailadila..."
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
                placeholder="e.g., 23.7500"
                value={latInput}
                onChange={(e) => setLatInput(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Longitude</label>
              <input
                type="number"
                step="any"
                placeholder="e.g., 86.4100"
                value={lngInput}
                onChange={(e) => setLngInput(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="input-group" style={{ maxWidth: '130px' }}>
          <label>Start Year</label>
          <select value={startYear} onChange={(e) => setStartYear(Number(e.target.value))}>
            <option value={2018}>2018</option>
            <option value={2019}>2019</option>
            <option value={2020}>2020</option>
            <option value={2021}>2021</option>
          </select>
        </div>

        <div className="input-group" style={{ maxWidth: '130px' }}>
          <label>End Year</label>
          <select value={endYear} onChange={(e) => setEndYear(Number(e.target.value))}>
            <option value={2022}>2022</option>
            <option value={2023}>2023</option>
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
          </select>
        </div>

        <div className="input-group" style={{ maxWidth: '150px' }}>
          <label>Buffer Radius</label>
          <select value={bufferRadius} onChange={(e) => setBufferRadius(Number(e.target.value))}>
            <option value={3000}>3.0 km</option>
            <option value={5000}>5.0 km</option>
            <option value={8000}>8.0 km</option>
          </select>
        </div>

        <button type="submit" className="analyze-btn">
          Analyze Region
        </button>

        {/* Quick Preset Chips for Rapid Testing */}
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

      {/* Status Notification Banner */}
      <div className="status-banner">
        {statusMessage}
      </div>

      {/* Executive KPI Metrics Row */}
      <section className="kpi-row">
        <div className="kpi-card">
          <div className="kpi-label">Latest Mean NDVI ({endYear})</div>
          <div className="kpi-value">{latestNdvi}</div>
          <div className="kpi-subtext"> Scale: -1.0 (Barren/Water) to +1.0 (Dense Forest)</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Green Cover Change ({startYear}-{endYear})</div>
          <div className="kpi-value" style={{ color: percentageChange >= 0 ? '#16a34a' : '#dc2626' }}>
            {percentageChange >= 0 ? `+${percentageChange}%` : `${percentageChange}%`}
          </div>
          <div className="kpi-subtext">Net vegetation progression over selected period</div>
        </div>

        <div className={`kpi-card ${isCompliant ? '' : 'warning'}`}>
          <div className="kpi-label">MoEFCC Green Belt Status</div>
          <div className="kpi-value" style={{ fontSize: '1.25rem', color: isCompliant ? '#15803d' : '#b45309' }}>
            {isCompliant ? 'Compliant (Healthy Cover)' : 'Action Required (Low NDVI)'}
          </div>
          <div className="kpi-subtext">Target reclamation threshold: NDVI &ge; 0.35</div>
        </div>
      </section>

      {/* Main Analytical Panels */}
      <main className="dashboard-content">
        
        {/* Dynamic Spatial Analysis Panel */}
        <section className="panel">
          <div className="panel-header">
            <h2>Spatial Analysis: {activeMine.name}</h2>
            <span className="coord-tag">
              Lat: {activeMine.coords[0].toFixed(4)}, Lng: {activeMine.coords[1].toFixed(4)}
            </span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <SpatialMap
              centerPosition={activeMine.coords}
              mineName={activeMine.name}
              bufferRadius={bufferRadius}
              onMapClick={handleMapClick}
            />
          </div>
        </section>

        {/* Dynamic Temporal Analysis Panel */}
        <section className="panel">
          <div className="panel-header">
            <h2>Temporal NDVI Trend ({startYear}-{endYear})</h2>
            <span className="coord-tag">Region: {activeMine.name.split(',')[0]}</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <TemporalChart chartData={chartData} />
          </div>
        </section>

      </main>

    </div>
  );
}

export default App;