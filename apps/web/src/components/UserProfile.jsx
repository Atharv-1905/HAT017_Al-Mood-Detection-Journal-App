import React, { useState, useEffect } from 'react';
import { User, Settings, Clock, Activity, Search, ChevronRight, Lock, Trash2, TrendingUp, TrendingDown, Loader2, X, Brain } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserProfileHistory } from '../services/api';

const EMOTION_COLORS = { joy: 'bg-green-100 text-green-700', sadness: 'bg-blue-100 text-blue-700', fear: 'bg-yellow-100 text-yellow-700', anger: 'bg-red-100 text-red-700', neutral: 'bg-gray-100 text-gray-600' };

export default function UserProfile({ userProfile: defaultUser }) {
  const [tab, setTab] = useState('history');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    let mounted = true;
    getUserProfileHistory().then((data) => {
      if (mounted && data?.success) {
        setProfileData(data.profile);
        setHistory(data.history || []);
      }
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const fmtTime = (d) => d ? new Date(d).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '';

  if (loading) return <div className="p-8 text-center flex items-center justify-center text-text-light"><Loader2 className="w-6 h-6 animate-spin mr-2"/> Loading profile...</div>;

  const profile = profileData || {
    full_name: defaultUser?.username || 'User', email: defaultUser?.email || '',
    interests: '', activities: [],
  };

  const displayName = profile.full_name || profile.username || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'User';

  const interests = typeof profile.interests === 'string'
    ? profile.interests.split(',').map(i => i.trim()).filter(Boolean) : (profile.interests || []);

  // Single Day Dashboard
  if (selectedEntry) {
    const hourlyData = Array.from({ length: 8 }, (_, i) => ({
      time: `${9 + i}:00`,
      wellness: Math.max(10, Math.min(100, selectedEntry.wellness + (Math.random() * 40 - 20))),
    }));

    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-8 animate-fade-in">
        <button onClick={() => setSelectedEntry(null)} className="text-text-light hover:text-text mb-6 text-sm font-medium transition-colors">← Back to History</button>
        <div className="bg-surface rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col gap-8">
          
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-text">{fmtDate(selectedEntry.date)}</h2>
              <p className="text-text-light text-sm">{fmtTime(selectedEntry.date)}</p>
            </div>
            <div className="flex gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${EMOTION_COLORS[selectedEntry.emotion] || EMOTION_COLORS.neutral}`}>{selectedEntry.emotion}</span>
              {selectedEntry.riskLevel === 'high' && <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">High Risk</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-2xl text-center">
              <p className="text-xs text-text-light uppercase font-semibold mb-1">Emotion</p>
              <p className="text-lg font-bold text-text capitalize">{selectedEntry.emotion}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl text-center">
              <p className="text-xs text-text-light uppercase font-semibold mb-1">Wellness</p>
              <p className="text-lg font-bold text-text">{selectedEntry.wellness}/100</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl text-center">
              <p className="text-xs text-text-light uppercase font-semibold mb-1">Sentiment</p>
              <p className="text-lg font-bold text-text">{(selectedEntry.sentiment || 0).toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl text-center">
              <p className="text-xs text-text-light uppercase font-semibold mb-1">Confidence</p>
              <p className="text-lg font-bold text-text">{Math.round((selectedEntry.confidence || 0) * 100)}%</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-text mb-2 flex items-center gap-2"><Brain size={16} className="text-primary"/> Journal Entry</h4>
            <div className="bg-gray-50 p-5 rounded-2xl text-text text-sm leading-relaxed whitespace-pre-wrap italic">
              "{selectedEntry.fullText || selectedEntry.text}"
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-text mb-4">Hourly Wellness Trend</h3>
            <div className="h-48 bg-white border border-gray-100 rounded-2xl p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="time" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="wellness" stroke="#4ade80" strokeWidth={3} dot={{ r: 3, fill: '#fff', strokeWidth: 2, stroke: '#4ade80' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-8 animate-fade-in">

      {/* Profile Header */}
      <div className="bg-surface rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-8">
        <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-secondary to-primary p-1 shrink-0">
          <div className="w-full h-full bg-white rounded-full flex items-center justify-center"><User className="w-10 h-10 text-gray-400" /></div>
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-bold text-text mb-1">{displayName}</h1>
          <p className="text-text-light text-sm mb-1">{profile.email}</p>
          {profile.dob && <p className="text-xs text-gray-400 mb-5">Born {fmtDate(profile.dob)}</p>}
          <div className="flex flex-wrap justify-center md:justify-start gap-5">
            {interests.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Interests</p>
                <div className="flex flex-wrap gap-2">
                  {interests.map((i, idx) => <span key={idx} className="px-3 py-1 bg-blue-50 text-secondary text-sm rounded-lg font-medium">{i}</span>)}
                </div>
              </div>
            )}
            {profile.activities?.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Activities</p>
                <div className="flex flex-wrap gap-2">
                  {profile.activities.map((a, idx) => <span key={idx} className="px-3 py-1 bg-green-50 text-primary border border-green-100 text-sm rounded-lg font-medium capitalize">{a}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface p-1 rounded-full border border-gray-100 shadow-sm w-max">
        {[{ id: 'history', label: 'History', icon: Clock }, { id: 'settings', label: 'Settings', icon: Settings }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center px-5 py-2 rounded-full text-sm font-medium transition-all ${tab === t.id ? 'bg-primary text-white shadow-md' : 'text-text-light hover:text-text'}`}>
            <t.icon className="w-4 h-4 mr-2" />{t.label}
          </button>
        ))}
      </div>

      {/* History Tab */}
      {tab === 'history' && (
        <div className="space-y-4">
          {history.length === 0 && <p className="text-gray-500 text-center py-8">No journal entries found.</p>}
          {history.map(entry => (
            <button key={entry.id} onClick={() => setSelectedEntry(entry)}
              className="w-full bg-surface rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow text-left group">
              <div className="w-28 shrink-0">
                <p className="text-sm font-semibold text-text">{fmtDate(entry.date)}</p>
                <p className="text-xs text-gray-400">{fmtTime(entry.date)}</p>
                <div className="mt-2 flex flex-col gap-1.5">
                  <span className={`inline-block px-2.5 py-0.5 text-xs rounded-full font-medium capitalize max-w-max ${EMOTION_COLORS[entry.emotion] || EMOTION_COLORS.neutral}`}>{entry.emotion || 'unknown'}</span>
                  {(entry.riskLevel === 'high' || entry.riskLevel === 'critical') ? <span className="inline-block px-2.5 py-0.5 text-xs rounded-full font-medium bg-red-100 text-red-700 max-w-max">High Risk</span> : null}
                </div>
              </div>
              <div className="flex-1 border-l-2 border-gray-50 pl-5 group-hover:border-primary/20 transition-colors">
                <p className="text-text-light text-sm line-clamp-2">"{entry.text}"</p>
                <div className="mt-2 flex items-center text-xs text-gray-400 font-medium"><Activity className="w-3.5 h-3.5 mr-1" />Wellness: {entry.wellness}/100</div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Settings Tab */}
      {tab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center mb-4"><Lock className="w-5 h-5 text-secondary mr-2" /><h3 className="text-lg font-medium text-text">Reset Password</h3></div>
            <div className="space-y-4 max-w-md">
              <div><label className="block text-sm font-medium text-text mb-1">Current Password</label><input type="password" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="••••••••" /></div>
              <div><label className="block text-sm font-medium text-text mb-1">New Password</label><input type="password" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="••••••••" /></div>
              <button className="px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-green-500 transition-colors">Update Password</button>
            </div>
          </div>
          <div className="bg-surface rounded-3xl p-6 shadow-sm border border-red-100">
            <div className="flex items-center mb-4"><Trash2 className="w-5 h-5 text-red-500 mr-2" /><h3 className="text-lg font-medium text-red-600">Delete Account</h3></div>
            <p className="text-text-light text-sm mb-4 max-w-md">This action is permanent and cannot be undone. All your data will be erased.</p>
            <button className="px-6 py-3 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors">Delete My Account</button>
          </div>
        </div>
      )}
    </div>
  );
}
