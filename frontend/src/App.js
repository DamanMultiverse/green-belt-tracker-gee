// ==============================================================================
// MAIN DASHBOARD INTERFACE (INTEGRATED WITH GEE BACKEND)
// Description: Interactive dashboard fetching real-time NDVI data from Node.js API
// ==============================================================================

import React, { useState } from 'react';
import './App.css';
import SpatialMap from './SpatialMap';
import TemporalChart from './TemporalChart';

const KNOWN_MINES = [
  { name: 'Jharia Coalfield, Jharkhand', keywords: ['jharia', 'jhariya', 'dhanbad', 'bccl'], coords: [23.7500, 86.4100] },
  { name: 'Korba Coalfield (Gevra), Chhattisgarh', keywords: ['korba', 'gevra', 'dipka', 'kusmunda', 'secl'], coords: [22.3458, 82.5965] },
  { name: 'Singrauli Coalfield, MP / UP', keywords: ['singrauli', 'singroli', 'nigahi', 'jayant', 'dudhichua', 'ncl'], coords: [24.1997, 82.6645] },
  { name: 'Talcher Coalfield, Odisha', keywords: ['talcher', 'talchar', 'angul', 'mcl'], coords: [20.9500, 85.2167] },
  { name: 'Bailadila Iron Ore Mine, Chhattisgarh', keywords: ['bailadila', 'kirandul', 'bacheli', 'nmdc', 'dantewada'], coords: [18.6288, 81.2339] },
  { name: 'Neyveli Lignite Mine, Tamil Nadu', keywords: ['neyveli', 'nlc', 'cuddalore'], coords: [11.5975, 79.4864] }
];

function App() {
  const [searchMode, setSearchMode] = useState('name');
  const [searchQuery, setSearchQuery] = useState('Jharia Coalfield');
  const [latInput, setLatInput] = useState('23.7500');
  const [lngInput, setLngInput] = useState('86.4100');

  const [startYear, setStartYear] = useState(2019);
  const [endYear, setEndYear] = useState(2024);
  const [bufferRadius, setBufferRadius] = useState(5000);

  const [activeMine, setActiveMine] = useState({ name: 'Jharia Coalfield, Jharkhand', coords: [23.7500, 86.4100] });
  const [chartData, setChartData] = useState([]);
  const [statusMessage, setStatusMessage] = useState('Ready for spatial analysis. Please select a region and click "Analyze Region".');
  const [isLoading, setIsLoading] = useState(false);

  // Function to communicate with Node.js Backend API
  const fetchRealData = async (lat, lng, name, sYear, eYear, radius) => {
    setIsLoading(true);
    setStatusMessage(`Analyzing satellite data for ${name}... (This may take 10-30 seconds depending on GEE servers).`);
    
    try {
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, startYear: sYear, endYear: eYear, bufferRadius: radius })
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        setChartData(result.data);
        setStatusMessage(`Analysis complete for ${name}.`);
      } else {
        setStatusMessage('Error: Failed to process spatial analysis request on the server.');
      }
    } catch (error) {
      console.error(error);
      setStatusMessage('Error: Cannot connect to the backend server. Make sure it is running on port 5000.');
    }
    setIsLoading(false);
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();

    if (searchMode === 'coords') {
      const parsedLat = parseFloat(latInput);
      const parsedLng = parseFloat(lngInput);
      if (isNaN(parsedLat) || isNaN(parsedLng)) return setStatusMessage('Invalid coordinates entered.');
      
      const customName = `Custom Site (${parsedLat.toFixed(3)}, ${parsedLng.toFixed(3)})`;
      setActiveMine({ name: customName, coords: [parsedLat, parsedLng] });
      fetchRealData(parsedLat, parsedLng, customName, startYear, endYear, bufferRadius);
      return;
    }

    const cleanedQuery = searchQuery.trim().toLowerCase();
    if (!cleanedQuery) return;

    const matchedMine = KNOWN_MINES.find(m => m.name.toLowerCase().includes(cleanedQuery) || m.keywords.some(kw => cleanedQuery.includes(kw)));

    if (matchedMine) {
      setActiveMine({ name: matchedMine.name, coords: matchedMine.coords });
      setLatInput(String(matchedMine.coords[0]));
      setLngInput(String(matchedMine.coords[1]));
      fetchRealData(matchedMine.coords[0], matchedMine.coords[1], matchedMine.name, startYear, endYear, bufferRadius);
      return;
    }

    try {
      setStatusMessage(`Searching global directory for "${searchQuery}"...`);
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
      const results = await response.json();

      if (results && results.length > 0) {
        const foundLat = parseFloat(results[0].lat);
        const foundLng = parseFloat(results[0].lon);
        const displayName = results[0].display_name.split(',').slice(0, 2).join(', ');
        
        setActiveMine({ name: displayName, coords: [foundLat, foundLng] });
        setLatInput(foundLat.toFixed(4));
        setLngInput(foundLng.toFixed(4));
        fetchRealData(foundLat, foundLng, displayName, startYear, endYear, bufferRadius);
      } else {
        setStatusMessage(`Could not find exact match for "${searchQuery}".`);
      }
    } catch (error) {
      setStatusMessage('Network issue while searching global directory.');
    }
  };

  const handlePresetSelect = (mine) => {
    setSearchMode('name');
    setSearchQuery(mine.name);
    setLatInput(String(mine.coords[0]));
    setLngInput(String(mine.coords[1]));
  };

  const handleMapClick = (lat, lng) => {
    const formattedLat = Number(lat.toFixed(4));
    const formattedLng = Number(lng.toFixed(4));
    setLatInput(String(formattedLat));
    setLngInput(String(formattedLng));
    setSearchMode('coords');
  };

  const latestNdvi = chartData.length > 0 ? chartData[chartData.length - 1].ndvi : 0;
  const initialNdvi = chartData.length > 0 ? chartData[0].ndvi : 0;
  const percentageChange = initialNdvi > 0 ? (((latestNdvi - initialNdvi) / initialNdvi) * 100).toFixed(1) : 0;
  const isCompliant = latestNdvi >= 0.35;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-title">
          <h1>Satellite-Based Green Belt Tracker</h1>
          <p>Spatio-temporal environmental monitoring and mine reclamation system</p>
        </div>
        <div className="header-badge">Dataset: Sentinel-2 Harmonized (10m)</div>
      </header>

      <form className="control-bar" onSubmit={handleAnalyze}>
        <div className="search-mode-toggle">
          <button type="button" className={`toggle-btn ${searchMode === 'name' ? 'active' : ''}`} onClick={() => setSearchMode('name')}>Mine Name</button>
          <button type="button" className={`toggle-btn ${searchMode === 'coords' ? 'active' : ''}`} onClick={() => setSearchMode('coords')}>Coordinates</button>
        </div>

        {searchMode === 'name' ? (
          <div className="input-group" style={{ flex: 2 }}>
            <label>Search Mine or Coalfield Name</label>
            <input type="text" placeholder="e.g., Jharia, Korba, Singrauli..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        ) : (
          <div className="coord-inputs">
            <div className="input-group">
              <label>Latitude</label>
              <input type="number" step="any" value={latInput} onChange={(e) => setLatInput(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Longitude</label>
              <input type="number" step="any" value={lngInput} onChange={(e) => setLngInput(e.target.value)} />
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

        <button type="submit" className="analyze-btn" disabled={isLoading} style={{ opacity: isLoading ? 0.7 : 1 }}>
          {isLoading ? 'Analyzing...' : 'Analyze Region'}
        </button>

        <div className="quick-presets">
          <span>Quick Select Mine:</span>
          {KNOWN_MINES.map((mine, idx) => (
            <button key={idx} type="button" className="preset-chip" onClick={() => handlePresetSelect(mine)}>{mine.name.split(',')[0]}</button>
          ))}
        </div>
      </form>

      <div className="status-banner">{statusMessage}</div>

      <section className="kpi-row">
        <div className="kpi-card">
          <div className="kpi-label">Latest Mean NDVI ({endYear})</div>
          <div className="kpi-value">{latestNdvi || '--'}</div>
          <div className="kpi-subtext">Scale: -1.0 to +1.0</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Green Cover Change ({startYear}-{endYear})</div>
          <div className="kpi-value" style={{ color: percentageChange >= 0 ? '#16a34a' : '#dc2626' }}>
            {chartData.length > 0 ? (percentageChange >= 0 ? `+${percentageChange}%` : `${percentageChange}%`) : '--'}
          </div>
          <div className="kpi-subtext">Net vegetation progression</div>
        </div>
        <div className={`kpi-card ${chartData.length > 0 && !isCompliant ? 'warning' : ''}`}>
          <div className="kpi-label">MoEFCC Green Belt Status</div>
          <div className="kpi-value" style={{ fontSize: '1.25rem', color: chartData.length > 0 ? (isCompliant ? '#15803d' : '#b45309') : '#0f172a' }}>
            {chartData.length > 0 ? (isCompliant ? 'Compliant (Healthy Cover)' : 'Action Required (Low NDVI)') : '--'}
          </div>
          <div className="kpi-subtext">Target threshold: NDVI &ge; 0.35</div>
        </div>
      </section>

      <main className="dashboard-content">
        <section className="panel">
          <div className="panel-header">
            <h2>Spatial Analysis: {activeMine.name}</h2>
            <span className="coord-tag">Lat: {activeMine.coords[0].toFixed(4)}, Lng: {activeMine.coords[1].toFixed(4)}</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <SpatialMap centerPosition={activeMine.coords} mineName={activeMine.name} bufferRadius={bufferRadius} onMapClick={handleMapClick} />
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Temporal NDVI Trend ({startYear}-{endYear})</h2>
            <span className="coord-tag">Region: {activeMine.name.split(',')[0]}</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {chartData.length > 0 ? (
              <TemporalChart chartData={chartData} />
            ) : (
              <div className="placeholder-box">{isLoading ? 'Fetching Satellite Data...' : 'Click "Analyze Region" to generate chart'}</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;