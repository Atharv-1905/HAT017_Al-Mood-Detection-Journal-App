import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

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

  // Calculate Emotion Distribution for Pie Chart
  const emotionData = useMemo(() => {
    const counts = {};
    entries.forEach(e => {
      const em = e.analysis.emotion || 'neutral';
      counts[em] = (counts[em] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key]
    }));
  }, [entries]);

  const EMOTION_COLORS = {
    joy: '#4CAF50',
    happy: '#4CAF50',
    sadness: '#a180ff',
    sad: '#a180ff',
    anger: '#ff4757',
    angry: '#ff4757',
    fear: '#ffb347',
    fearful: '#ffb347',
    neutral: '#c5c6c7'
  };

  const avgWellness = Math.round(entries.reduce((acc, curr) => acc + curr.analysis.wellness_index, 0) / entries.length);

  return (
    <div className="tab-container scrollable">
      <header className="header mb-4">
        <h2>Interactive Insights</h2>
      </header>

      {/* Main KPI */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="stat-overview-card"
        style={{ background: 'linear-gradient(135deg, var(--card-bg), var(--input-bg))', border: '1px solid var(--accent-color)' }}
      >
        <h3>Average Wellness Score</h3>
        <div className="massive-score" style={{ color: 'var(--accent-color)', textShadow: '0 0 20px rgba(102, 252, 241, 0.4)' }}>
          {avgWellness}
        </div>
        <p style={{ color: 'var(--text-muted)' }}>Out of 100 over your last {entries.length} entries</p>
      </motion.div>

      {/* Wellness Trend Area Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="chart-card"
      >
        <h3>Wellness Trendline</h3>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorWellness" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" stroke="#c5c6c7" fontSize={10} tickMargin={10} />
              <YAxis domain={[0, 100]} stroke="#c5c6c7" fontSize={10} width={30} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--accent-color)', borderRadius: '12px' }}
                itemStyle={{ color: 'var(--text-main)', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="wellness" stroke="var(--accent-color)" strokeWidth={3} fillOpacity={1} fill="url(#colorWellness)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Emotion Distribution Pie Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="chart-card"
        style={{ marginTop: '1.5rem', paddingBottom: '2rem' }}
      >
        <h3>Emotion Distribution</h3>
        <div style={{ height: '200px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={emotionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {emotionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={EMOTION_COLORS[entry.name.toLowerCase()] || '#8884d8'} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--card-bg)', border: 'none', borderRadius: '12px' }}
                itemStyle={{ textTransform: 'capitalize' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {emotionData.map(entry => (
             <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: EMOTION_COLORS[entry.name.toLowerCase()] || '#8884d8' }}></div>
                <span style={{ fontSize: '0.9rem', textTransform: 'capitalize', color: 'var(--text-main)' }}>{entry.name}</span>
             </div>
          ))}
        </div>
      </motion.div>

    </div>
  );
}
