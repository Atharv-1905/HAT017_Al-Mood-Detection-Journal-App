import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Stats({ entries }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="tab-container center-content">
        <h2>Wellness Stats</h2>
        <p className="empty-state">Not enough data to display stats.</p>
      </div>
    );
  }

  const chartData = [...entries].reverse().map(e => ({
    name: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    wellness: e.analysis.wellness_index,
    emotion: e.analysis.emotion
  }));

  const avgWellness = Math.round(entries.reduce((acc, curr) => acc + curr.analysis.wellness_index, 0) / entries.length);

  return (
    <div className="tab-container scrollable">
      <header className="header mb-4">
        <h2>Insights</h2>
      </header>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="stat-overview-card"
      >
        <h3>Average Wellness</h3>
        <div className="massive-score">{avgWellness}</div>
        <p>Out of 100 over your last {entries.length} entries</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="chart-card"
      >
        <h3>Wellness Trend</h3>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" stroke="#c5c6c7" fontSize={10} tickMargin={10} />
              <YAxis domain={[0, 100]} stroke="#c5c6c7" fontSize={10} width={30} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2833', border: '1px solid #66fcf1', borderRadius: '8px' }}
                itemStyle={{ color: '#66fcf1' }}
              />
              <Line type="monotone" dataKey="wellness" stroke="#66fcf1" strokeWidth={3} dot={{ r: 4, fill: '#1f2833', stroke: '#66fcf1', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
