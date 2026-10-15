import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock data representing the NDVI trend from 2019 to 2024
const data = [
  { year: '2019', ndvi: 0.22 },
  { year: '2020', ndvi: 0.28 },
  { year: '2021', ndvi: 0.35 },
  { year: '2022', ndvi: 0.41 },
  { year: '2023', ndvi: 0.48 },
  { year: '2024', ndvi: 0.52 },
];

const TemporalChart = () => {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: '350px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="year" tick={{ fill: '#7f8c8d' }} />
          <YAxis 
            domain={[0, 0.6]} 
            tick={{ fill: '#7f8c8d' }} 
            label={{ value: 'Average NDVI', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#2c3e50' } }} 
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} 
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Line 
            type="monotone" 
            dataKey="ndvi" 
            stroke="#006400" 
            strokeWidth={3} 
            name="NDVI Trend (Greenness)" 
            activeDot={{ r: 8, fill: '#2ca02c' }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TemporalChart;