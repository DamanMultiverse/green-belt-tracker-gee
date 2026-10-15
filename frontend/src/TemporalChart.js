// ==============================================================================
// TEMPORAL NDVI CHART COMPONENT
// Description: Renders multi-year NDVI progression and reclamation threshold line
// ==============================================================================

import React from 'react';
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
  return (
    <div style={{ width: '100%', height: '100%', minHeight: '360px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="year" tick={{ fill: '#475569', fontSize: 12 }} />
          <YAxis
            domain={[0, 0.7]}
            tick={{ fill: '#475569', fontSize: 12 }}
            label={{
              value: 'Mean NDVI Index',
              angle: -90,
              position: 'insideLeft',
              style: { textAnchor: 'middle', fill: '#1e293b', fontWeight: 600 }
            }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              boxShadow: '0 4px 10px rgba(0,0,0,0.08)'
            }}
          />
          <Legend wrapperStyle={{ paddingTop: '15px' }} />

          {/* Statutory threshold reference line for healthy vegetation */}
          <ReferenceLine
            y={0.35}
            label={{ value: 'Target Green Belt Threshold (0.35)', position: 'top', fill: '#ca8a04', fontSize: 11 }}
            stroke="#eab308"
            strokeDasharray="4 4"
          />

          <Line
            type="monotone"
            dataKey="ndvi"
            stroke="#15803d"
            strokeWidth={3}
            name="Observed NDVI (Green Cover)"
            activeDot={{ r: 7, fill: '#22c55e' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TemporalChart;