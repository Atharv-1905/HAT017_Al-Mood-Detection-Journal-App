import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, BarChart2, TrendingUp, Heart, Brain, Sparkles } from 'lucide-react';

const COLORS = { joy: '#4ade80', sadness: '#60a5fa', fear: '#fbbf24', neutral: '#9ca3af', anger: '#f87171', surprise: '#a78bfa' };
const PIE_COLORS = ['#4ade80', '#60a5fa', '#fbbf24', '#f87171', '#9ca3af', '#a78bfa'];

const SUGGESTIONS_BY_INTEREST = {
  reading: 'Try reading a calming book before bed tonight.',
  yoga: 'A 10-minute yoga session could help reset your mood.',
  coding: 'Take a short coding break — a walk does wonders.',
  music: 'Put on your favourite playlist to lift your spirits.',
  hiking: 'Plan a short nature hike this weekend.',
  cooking: "Cook something comforting — it is meditative.",
  gaming: 'A quick gaming session might help you decompress.',
  meditation: 'Try a 5-minute guided meditation right now.',
  default: "Practice gratitude — write down 3 things you are thankful for.",
};

function generateMockData(offset) {
  const base = offset === '1_month' ? 78 : offset === '1_week' ? 60 : 42;
  const days = offset === '1_month' ? 30 : offset === '1_week' ? 7 : 1;
  const points = days === 1 ? 12 : days;

  const lineData = [];
  const counts = { joy: 0, sadness: 0, fear: 0, neutral: 0, anger: 0 };

  for (let i = 0; i < points; i++) {
    const roll = Math.random();
    let em = 'neutral';
    if (offset === 'present') {
      em = roll > 0.6 ? 'sadness' : roll > 0.3 ? 'fear' : roll > 0.15 ? 'anger' : 'neutral';
    } else if (offset === '1_week') {
      em = roll > 0.5 ? 'joy' : roll > 0.2 ? 'neutral' : 'sadness';
    } else {
      em = roll > 0.25 ? 'joy' : 'neutral';
    }
    counts[em]++;
    lineData.push({ time: days === 1 ? `${i * 2}:00` : `Day ${i + 1}`, wellness: Math.max(0, Math.min(100, base + (Math.random() * 30 - 15))) });
  }

  const barData = Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const pieData = barData.filter(d => d.value > 0);
  const avgWellness = Math.round(lineData.reduce((s, d) => s + d.wellness, 0) / lineData.length);
  const dominant = barData[0]?.name || 'neutral';

  return { lineData, barData, pieData, avgWellness, dominant, totalEntries: points };
}

export default function HistoricalAnalytics({ timeTravelOffset, userProfile }) {
  const [viewMode, setViewMode] = useState('Weekly');

  const data = useMemo(() => {
    let off = timeTravelOffset;
    if (viewMode === 'Daily') off = 'present';
    if (viewMode === 'Weekly' && timeTravelOffset === 'present') off = '1_week';
    if (viewMode === 'Monthly') off = '1_month';
    return generateMockData(off);
  }, [timeTravelOffset, viewMode]);

  const activities = userProfile?.activities || [];
  const personalSuggestions = activities.slice(0, 3).map(a => SUGGESTIONS_BY_INTEREST[a] || SUGGESTIONS_BY_INTEREST.default);
  if (personalSuggestions.length === 0) personalSuggestions.push(SUGGESTIONS_BY_INTEREST.default);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-text">Analytics Dashboard</h2>
          <p className="text-text-light mt-1">Your emotional wellness at a glance.</p>
        </div>
        <div className="flex bg-surface p-1 rounded-full border border-gray-100 shadow-sm mt-4 sm:mt-0">
          {['Daily', 'Weekly', 'Monthly'].map(m => (
            <button key={m} onClick={() => setViewMode(m)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${viewMode === m ? 'bg-primary text-white shadow-md' : 'text-text-light hover:text-text'}`}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center"><TrendingUp className="w-6 h-6 text-primary" /></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Avg Wellness</p><p className="text-2xl font-bold text-text">{data.avgWellness}<span className="text-sm text-gray-400 ml-0.5">/100</span></p></div>
        </div>
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center"><Heart className="w-6 h-6 text-secondary" /></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Dominant Mood</p><p className="text-2xl font-bold text-text capitalize">{data.dominant}</p></div>
        </div>
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center"><Brain className="w-6 h-6 text-purple-500" /></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Entries</p><p className="text-2xl font-bold text-text">{data.totalEntries}</p></div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Line Chart */}
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center mb-5"><Activity className="w-5 h-5 text-primary mr-2" /><h3 className="text-lg font-medium text-text">Wellness Trend ({viewMode})</h3></div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.lineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="time" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="wellness" stroke="#4ade80" strokeWidth={3} dot={{ r: 3, fill: '#fff', strokeWidth: 2, stroke: '#4ade80' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center mb-5"><BarChart2 className="w-5 h-5 text-secondary mr-2" /><h3 className="text-lg font-medium text-text">Emotion Distribution</h3></div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {data.pieData.map((_, i) => <Cell key={i} fill={COLORS[data.pieData[i].name] || PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Personalized Suggestions */}
      <div className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center mb-4"><Sparkles className="w-5 h-5 text-yellow-500 mr-2" /><h3 className="text-lg font-medium text-text">Personalized Suggestions</h3></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {personalSuggestions.map((s, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-sm text-text-light">{s}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
