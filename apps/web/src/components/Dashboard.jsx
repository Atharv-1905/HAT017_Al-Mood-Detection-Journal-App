import React, { useEffect, useState, useMemo } from 'react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar, AreaChart, Area } from 'recharts';
import { getDashboardAnalytics } from '../services/api';
import { Activity, Brain, TrendingUp, AlertTriangle } from 'lucide-react';
import { getFacialLogs } from '../services/api';

const COLORS = {
  joy: '#4ade80',     // green
  sadness: '#60a5fa', // blue
  fear: '#fbbf24',    // yellow
  neutral: '#9ca3af', // gray
  anger: '#f87171'    // red
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState('daily');
  const [facialLogs, setFacialLogs] = useState([]);

  useEffect(() => {
    async function load() {
      const result = await getDashboardAnalytics();
      setData(result);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const logs = await getFacialLogs({ limit: 200 });
        if (mounted) setFacialLogs(logs || []);
      } catch (e) {
        console.warn('Failed to fetch facial logs', e);
      }
    })();
    return () => { mounted = false; };
  }, [data]);

  if (loading) return <div className="p-8 text-center text-text-light">Loading insights...</div>;
  if (!data) return null;

  // Aggregate emotions for Pie Chart (journal)
  const emotionCounts = (data.mood_history || []).reduce((acc, curr) => {
    acc[curr.emotion] = (acc[curr.emotion] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.keys(emotionCounts).map((key) => ({ name: key, value: emotionCounts[key] }));

  // Compute aggregated counts for comparison (simple mock aggregation)
  const categories = ['joy', 'sadness', 'fear', 'anger', 'neutral', 'stress'];
  const claimedCounts = categories.map((c) => ({ emotion: c, value: (emotionCounts[c] || 0) }));
  const actualCounts = categories.map((c) => ({ emotion: c, value: facialLogs.filter((f) => f.predicted_emotion === c).length }));

  // Build data for composed chart: one entry per emotion with claimed vs actual
  const compareData = categories.map((c) => ({ emotion: c, claimed: emotionCounts[c] || 0, actual: facialLogs.filter((f) => f.predicted_emotion === c).length }));

  // Discrepancy insight
  const topClaimed = Object.keys(emotionCounts).sort((a,b) => (emotionCounts[b]||0)-(emotionCounts[a]||0))[0] || 'none';
  const topActual = [...new Set(facialLogs.map((f) => f.predicted_emotion))][0] || 'none';

  // Sentiment data mapping
  const sentimentData = (data.mood_history || []).map(d => ({
    date: d.date,
    sentiment: (d.sentiment || 0).toFixed(2),
  }));

  // Risk events count
  const riskEventsCount = data.risk_trend ? data.risk_trend.reduce((sum, item) => sum + (item.count || 0), 0) : 0;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8 animate-fade-in">
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="bg-surface rounded-2xl p-6 shadow-sm border border-gray-100 flex-1 flex items-center space-x-4">
          <div className="p-3 bg-green-50 rounded-xl text-primary"><Activity size={24} /></div>
          <div>
            <p className="text-sm text-text-light">Average Wellness</p>
            <p className="text-2xl font-semibold text-text">{data.avg_wellness.toFixed(1)} / 100</p>
          </div>
        </div>
        <div className="bg-surface rounded-2xl p-6 shadow-sm border border-gray-100 flex-1 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 rounded-xl text-secondary"><Brain size={24} /></div>
          <div>
            <p className="text-sm text-text-light">Dominant Emotion</p>
            <p className="text-2xl font-semibold text-text capitalize">{data.dominant_emotion}</p>
          </div>
        </div>
        <div className="bg-surface rounded-2xl p-6 shadow-sm border border-gray-100 flex-1 flex items-center space-x-4">
          <div className="p-3 bg-yellow-50 rounded-xl text-warning"><TrendingUp size={24} /></div>
          <div>
            <p className="text-sm text-text-light">Entries ({data.period})</p>
            <p className="text-2xl font-semibold text-text">{data.total_entries}</p>
          </div>
        </div>
        <div className="bg-surface rounded-2xl p-6 shadow-sm border border-gray-100 flex-1 flex items-center space-x-4">
          <div className="p-3 bg-red-50 rounded-xl text-red-500"><AlertTriangle size={24} /></div>
          <div>
            <p className="text-sm text-text-light">Risk Events</p>
            <p className="text-2xl font-semibold text-text">{riskEventsCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-surface rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-text mb-6">Wellness Trend</h3>
            <div className="flex gap-2">
              <button onClick={() => setScale('daily')} className={`px-3 py-1 rounded ${scale==='daily'?'bg-primary text-white':'bg-white'}`}>Daily</button>
              <button onClick={() => setScale('weekly')} className={`px-3 py-1 rounded ${scale==='weekly'?'bg-primary text-white':'bg-white'}`}>Weekly</button>
              <button onClick={() => setScale('monthly')} className={`px-3 py-1 rounded ${scale==='monthly'?'bg-primary text-white':'bg-white'}`}>Monthly</button>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="99%" height="100%">
              <LineChart data={data.mood_history}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="wellness_index" 
                  stroke="#4ade80" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#4ade80', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-surface rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-lg font-medium text-text mb-4">Emotion Distribution (Journal)</h3>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="99%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS.neutral} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">Claimed vs Actual (Today)</h4>
            <div className="h-40">
              <ResponsiveContainer width="99%" height="100%">
                <ComposedChart data={compareData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <XAxis dataKey="emotion" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="claimed" fill="#60a5fa" barSize={18} name="Claimed" />
                  <Bar dataKey="actual" fill="#f97316" barSize={18} name="Actual" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

      {/* Sentiment Area Chart */}
      <div className="bg-surface rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-medium text-text mb-4">Sentiment Tracking (-1 to +1)</h3>
        <div className="h-64">
          <ResponsiveContainer width="99%" height="100%">
            <AreaChart data={sentimentData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} domain={[-1, 1]} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Area type="monotone" dataKey="sentiment" stroke="#818cf8" fillOpacity={1} fill="url(#colorSentiment)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium text-text mb-4">Discrepancy Matrix</h3>
          <div className="text-sm text-text-light">
            {topClaimed !== topActual ? (
              <p>
                Insight: Your journal shows <strong className="capitalize">{topClaimed}</strong>, but ambient facial tracking
                shows <strong className="capitalize">{topActual}</strong>. Consider a short check-in: is your typing reflecting how you actually feel?
              </p>
            ) : (
              <p>No major discrepancy detected between journal and facial cues today.</p>
            )}
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium text-text mb-4">Ambient Log Samples</h3>
          <div className="text-sm text-text-light max-h-48 overflow-auto">
            {facialLogs.length === 0 && <p className="text-xs text-gray-500">No ambient captures yet.</p>}
            {facialLogs.slice(0, 12).map((f) => (
              <div key={f.id} className="mb-2 border-b border-gray-100 pb-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm capitalize">{f.predicted_emotion}</div>
                  <div className="text-xs text-gray-500">{Math.round(f.confidence_score * 100)}%</div>
                </div>
                <div className="text-xs text-gray-400 mt-1">{new Date(f.timestamp).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
