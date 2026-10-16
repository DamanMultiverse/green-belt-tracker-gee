// ==============================================================================
// MULTI-PARAMETER TEMPORAL CHART COMPONENT
// Description: Interactive Recharts component supporting switching between
//              NDVI (Green Belt), Land Surface Temperature (LST), and Dust Proxy.
// ==============================================================================

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer
} from 'recharts';

const TemporalChart = ({ chartData }) => {
  const [activeMetric, setActiveMetric] = useState('ndvi');

  const metricConfig = {
    ndvi: {
      label: 'Mean NDVI (Greenness)',
      color: '#15803d',
      dotColor: '#22c55e',
      domain: [0, 0.7],
      threshold: 0.35,
      thresholdLabel: 'MoEFCC Target Threshold (0.35)'
    },
    lst: {
      label: 'Surface Temperature (°C)',
      color: '#dc2626',
      dotColor: '#f87171',
      domain: ['auto', 'auto'],
      threshold: 34.5,
      thresholdLabel: 'Thermal Anomaly Threshold (34.5 °C)'
    },
    dust: {
      label: 'Fugitive Dust / SPM Proxy Index',
      color: '#d97706',
      dotColor: '#fbbf24',
      domain: [0, 0.35],
      threshold: 0.08,
      thresholdLabel: 'DGMS High Dust Alert (0.08)'
    }
  };

  const current = metricConfig[activeMetric];

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Metric Selector Tabs */}
      <div className="chart-metric-tabs">
        <button
          type="button"
          className={`metric-tab-btn ${activeMetric === 'ndvi' ? 'active-ndvi' : ''}`}
          onClick={() => setActiveMetric('ndvi')}
        >
          NDVI (Green Cover)
        </button>
        <button
          type="button"
          className={`metric-tab-btn ${activeMetric === 'lst' ? 'active-lst' : ''}`}
          onClick={() => setActiveMetric('lst')}
        >
          Surface Temp (LST °C)
        </button>
        <button
          type="button"
          className={`metric-tab-btn ${activeMetric === 'dust' ? 'active-dust' : ''}`}
          onClick={() => setActiveMetric('dust')}
        >
          Dust / Particulate Proxy
        </button>
      </div>

      <div style={{ flex: 1, minHeight: '340px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 10, bottom: 15 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fill: '#475569', fontSize: 12 }} />
            <YAxis
              domain={current.domain}
              tick={{ fill: '#475569', fontSize: 12 }}
              label={{
                value: current.label,
                angle: -90,
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: '#1e293b', fontWeight: 600, fontSize: 12 }
              }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                boxShadow: '0 4px 10px rgba(0,0,0,0.08)'
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />

            <ReferenceLine
              y={current.threshold}
              label={{
                value: current.thresholdLabel,
                position: 'top',
                fill: '#64748b',
                fontSize: 11
              }}
              stroke="#94a3b8"
              strokeDasharray="4 4"
            />

            <Line
              type="monotone"
              dataKey={activeMetric}
              stroke={current.color}
              strokeWidth={3}
              name={current.label}
              activeDot={{ r: 7, fill: current.dotColor }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TemporalChart;