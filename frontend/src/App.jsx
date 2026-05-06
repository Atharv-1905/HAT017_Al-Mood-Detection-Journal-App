import React, { useState, useEffect } from 'react';
import { Home as HomeIcon, Book, BarChart2, Sun, Moon, Camera, Lock, X } from 'lucide-react';
import Home from './components/Home';
import Journal from './components/Journal';
import Stats from './components/Stats';
import LiveTracker from './components/LiveTracker';
import Quotes from './components/Quotes';
import Auth from './components/Auth';
import Profile from './components/Profile';
import { MessageSquareQuote, UserCircle2 } from 'lucide-react';
import axios from 'axios';
import './App.css';

const MOCK_ENTRIES = [
  {
    id: '3',
    text: "Went for a morning run. The fresh air really cleared my mind.",
    date: new Date(Date.now() - 86400000 * 1).toISOString(),
    analysis: { emotion: "joy", wellness_index: 92, risk_level: "low" }
  },
  {
    id: '2',
    text: "Feeling a bit overwhelmed with the upcoming deadlines. Need to take a break.",
    date: new Date(Date.now() - 86400000 * 3).toISOString(),
    analysis: { emotion: "sadness", wellness_index: 45, risk_level: "medium" }
  },
  {
    id: '1',
    text: "Had a really productive day at work. I finally finished the project I was stressing over!",
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
    analysis: { emotion: "joy", wellness_index: 85, risk_level: "low" }
  }
];

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [entries, setEntries] = useState([]);
  const [theme, setTheme] = useState('dark');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [demoCount, setDemoCount] = useState(parseInt(localStorage.getItem('mindtrace_demo_count') || '0'));
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('mindtrace_token');
    if (token) {
      setIsAuthenticated(true);

      // Fetch User Profile for Name
      axios.get(`https://mindtrace-backend-ygob.onrender.com/api/auth/profile?token=${token}`)
        .then(res => {
          if (res.data && res.data.full_name) {
            setUserName(res.data.full_name.split(' ')[0]);
          }
        })
        .catch(err => console.error("Profile Fetch Error", err));

      // Fetch DB Entries!
      axios.get(`https://mindtrace-backend-ygob.onrender.com/api/entries?token=${token}`)
        .then(res => {
          if (res.data) setEntries(res.data);
        })
        .catch(err => {
          console.error("DB Fetch Error", err);
          const saved = localStorage.getItem('mindtrace_entries');
          if (saved) setEntries(JSON.parse(saved));
        });
    } else {
      // Demo mode entries
      const saved = localStorage.getItem('mindtrace_entries');
      if (saved && JSON.parse(saved).length > 0) {
        setEntries(JSON.parse(saved));
      } else {
        setEntries(MOCK_ENTRIES);
      }
    }
  }, [isAuthenticated]);

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    // Entries fetching is now handled in the first useEffect based on auth status

    // Register Service Worker for Mobile Notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('Service Worker Registered'))
        .catch((err) => console.error('Service Worker Error', err));
    }

    // Set up hourly notification background task
    const hourlyInterval = setInterval(() => {
      if (Notification.permission === 'granted') {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification("MindTrace Check-in 🕒", {
              body: "It's been an hour! Take a deep breath and log your current mood.",
              vibrate: [200, 100, 200]
            });
          });
        } else {
          new Notification("MindTrace Check-in 🕒", {
            body: "It's been an hour! Take a deep breath and log your current mood.",
          });
        }
      }
    }, 3600000); // 1 hour

    return () => clearInterval(hourlyInterval);
  }, []);

  const addEntry = async (newEntry) => {
    const updated = [newEntry, ...entries];
    setEntries(updated);

    if (isAuthenticated) {
      try {
        const token = localStorage.getItem('mindtrace_token');
        await axios.post(`https://mindtrace-backend-ygob.onrender.com/api/entries?token=${token}`, {
          text: newEntry.text,
          emotion: newEntry.analysis.emotion,
          wellness_index: newEntry.analysis.wellness_index,
          risk_level: newEntry.analysis.risk_level
        });
      } catch (err) {
        console.error("Failed to save entry to DB", err);
      }
    } else {
      // Save locally if in Demo mode
      localStorage.setItem('mindtrace_entries', JSON.stringify(updated));
    }
  };

  const editEntry = async (entryId, newText, newAnalysisData = null) => {
    const updated = entries.map(e => {
      if (e.id === entryId) {
        return {
          ...e,
          text: newText,
          date: new Date().toISOString(),
          ...(newAnalysisData && { analysis: newAnalysisData })
        };
      }
      return e;
    });
    setEntries(updated);

    if (isAuthenticated) {
      try {
        const token = localStorage.getItem('mindtrace_token');
        const payload = { text: newText };
        if (newAnalysisData) {
          payload.emotion = newAnalysisData.emotion;
          payload.wellness_index = newAnalysisData.wellness_index;
          payload.risk_level = newAnalysisData.risk_level;
        }
        await axios.put(`https://mindtrace-backend-ygob.onrender.com/api/entries/${entryId}?token=${token}`, payload);
      } catch (err) { console.error("Edit error", err); }
    } else {
      localStorage.setItem('mindtrace_entries', JSON.stringify(updated));
    }
  };

  const editAndReanalyzeEntry = async (entryId, newText) => {
    // 1. Instantly update the text so the UI feels lightning fast
    await editEntry(entryId, newText);

    // 2. Run the heavy AI analysis in the background
    try {
      const aiRes = await axios.post(`https://mindtrace-backend-ygob.onrender.com/api/analyze`, { text: newText });

      // 3. Silently update the entry again with the new emotion statistics once AI finishes
      await editEntry(entryId, newText, aiRes.data);
      return aiRes.data;
    } catch (error) {
      console.error("Re-analyze error", error);
      return null;
    }
  };

  const deleteEntry = async (entryId) => {
    const updated = entries.filter(e => e.id !== entryId);
    setEntries(updated);
    if (isAuthenticated) {
      try {
        const token = localStorage.getItem('mindtrace_token');
        await axios.delete(`https://mindtrace-backend-ygob.onrender.com/api/entries/${entryId}?token=${token}`);
      } catch (err) { console.error("Delete error", err); }
    } else {
      localStorage.setItem('mindtrace_entries', JSON.stringify(updated));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("mindtrace_token");
    setIsAuthenticated(false);
    setIsDemo(false);
    setActiveTab('home');
  };

  const handleNavClick = (tabName) => {
    if (tabName === 'home') {
      setActiveTab('home');
      return;
    }
    if (isDemo && !isAuthenticated) {
      setShowAuthModal(true);
    } else {
      setActiveTab(tabName);
    }
  };

  const handleDemoAnalyze = () => {
    const newCount = demoCount + 1;
    setDemoCount(newCount);
    localStorage.setItem('mindtrace_demo_count', newCount.toString());
  };

  if (!isAuthenticated && !isDemo) {
    return (
      <div className="app-wrapper">
        <div className="app-container">
          <Auth onLogin={() => setIsAuthenticated(true)} onDemo={() => setIsDemo(true)} />
        </div>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      <div className="app-container">

        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <main className="main-content">
          {activeTab === 'home' && <Home onSaveEntry={addEntry} isDemo={isDemo} isAuthenticated={isAuthenticated} demoCount={demoCount} onRequireLogin={() => setShowAuthModal(true)} onDemoAnalyze={handleDemoAnalyze} userName={userName} />}
          {activeTab === 'tracker' && <LiveTracker />}
          {activeTab === 'journal' && <Journal entries={entries} onEdit={editEntry} onReanalyzeEdit={editAndReanalyzeEntry} onDelete={deleteEntry} />}
          {activeTab === 'stats' && <Stats entries={entries} />}
          {activeTab === 'quotes' && <Quotes />}
          {activeTab === 'profile' && <Profile onLogout={handleLogout} />}
        </main>

        <nav className="bottom-nav">
          <button
            className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <HomeIcon size={24} />
            <span style={{ fontSize: '10px' }}>Check In</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'tracker' ? 'active' : ''}`}
            onClick={() => handleNavClick('tracker')}
            style={{ position: 'relative' }}
          >
            <Camera size={24} color={isDemo && !isAuthenticated ? '#555' : undefined} />
            {isDemo && !isAuthenticated && <Lock size={12} color="#888" style={{ position: 'absolute', top: 5, right: '20%' }} />}
            <span style={{ fontSize: '10px', color: isDemo && !isAuthenticated ? '#555' : undefined }}>Live Scan</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'journal' ? 'active' : ''}`}
            onClick={() => handleNavClick('journal')}
            style={{ position: 'relative' }}
          >
            <Book size={24} color={isDemo && !isAuthenticated ? '#555' : undefined} />
            {isDemo && !isAuthenticated && <Lock size={12} color="#888" style={{ position: 'absolute', top: 5, right: '20%' }} />}
            <span style={{ fontSize: '10px', color: isDemo && !isAuthenticated ? '#555' : undefined }}>Journal</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => handleNavClick('stats')}
            style={{ position: 'relative' }}
          >
            <BarChart2 size={24} color={isDemo && !isAuthenticated ? '#555' : undefined} />
            {isDemo && !isAuthenticated && <Lock size={12} color="#888" style={{ position: 'absolute', top: 5, right: '20%' }} />}
            <span style={{ fontSize: '10px', color: isDemo && !isAuthenticated ? '#555' : undefined }}>Stats</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'quotes' ? 'active' : ''}`}
            onClick={() => handleNavClick('quotes')}
            style={{ position: 'relative' }}
          >
            <MessageSquareQuote size={24} color={isDemo && !isAuthenticated ? '#555' : undefined} />
            {isDemo && !isAuthenticated && <Lock size={12} color="#888" style={{ position: 'absolute', top: 5, right: '20%' }} />}
            <span style={{ fontSize: '10px', color: isDemo && !isAuthenticated ? '#555' : undefined }}>Quotes</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => handleNavClick('profile')}
            style={{ position: 'relative' }}
          >
            <UserCircle2 size={24} color={isDemo && !isAuthenticated ? '#555' : undefined} />
            {isDemo && !isAuthenticated && <Lock size={12} color="#888" style={{ position: 'absolute', top: 5, right: '20%' }} />}
            <span style={{ fontSize: '10px', color: isDemo && !isAuthenticated ? '#555' : undefined }}>Profile</span>
          </button>
        </nav>

        {/* Locked Modal Overlay */}
        {showAuthModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '24px', maxWidth: '350px', width: '90%', textAlign: 'center', border: '1px solid var(--card-border)', position: 'relative' }}>
              <button onClick={() => setShowAuthModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
              <Lock size={40} color="var(--accent-color)" style={{ margin: '0 auto 1rem' }} />
              <h2 style={{ marginBottom: '1rem', fontSize: '1.4rem' }}>Feature Locked</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
                This feature is disabled in Demo Mode. Please register or login to unlock full access to MindTrace!
              </p>
              <button
                className="pulse-btn"
                style={{ width: '100%' }}
                onClick={() => {
                  setShowAuthModal(false);
                  setIsDemo(false);
                }}
              >
                Register / Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
