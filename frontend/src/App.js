// ==============================================================================
// MAIN DASHBOARD INTERFACE
// Description: Primary React component rendering the map and analytical charts
// ==============================================================================

import React from 'react';
import './App.css';
import SpatialMap from './SpatialMap';
import TemporalChart from './TemporalChart';

function App() {
  return (
    <div className="dashboard-container">
      
      {/* Top Navigation / Header */}
      <header className="dashboard-header">
        <h1>Satellite-Based Green Belt Tracker</h1>
        <p>Spatio-temporal environmental monitoring interface</p>
      </header>

      {/* Main Analytical Content */}
      <main className="dashboard-content">
        
        {/* Spatial Analysis Panel (Map) */}
        <section className="panel">
          <h2>Spatial Analysis (Jharia/Dhanbad)</h2>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <SpatialMap />
          </div>
        </section>

        {/* Temporal Analysis Panel (Chart) */}
        <section className="panel">
          <h2>Temporal NDVI Trend (2019-2024)</h2>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <TemporalChart />
          </div>
        </section>

      </main>

    </div>
  );
}

export default App;