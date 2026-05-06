import React, { useState, useEffect } from 'react';
import { Home as HomeIcon, Book, BarChart2, Sun, Moon } from 'lucide-react';
import Home from './components/Home';
import Journal from './components/Journal';
import Stats from './components/Stats';
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

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const saved = localStorage.getItem('mindtrace_entries');
    if (saved && JSON.parse(saved).length > 0) {
      setEntries(JSON.parse(saved));
    } else {
      // Seed with mock data so Stats & Journal are never empty for demo
      setEntries(MOCK_ENTRIES);
      localStorage.setItem('mindtrace_entries', JSON.stringify(MOCK_ENTRIES));
    }
  }, []);

  const addEntry = (newEntry) => {
    const updated = [newEntry, ...entries];
    setEntries(updated);
    localStorage.setItem('mindtrace_entries', JSON.stringify(updated));
  };

  return (
    <div className="app-wrapper">
      <div className="app-container">
        
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <main className="main-content">
          {activeTab === 'home' && <Home onSaveEntry={addEntry} />}
          {activeTab === 'journal' && <Journal entries={entries} />}
          {activeTab === 'stats' && <Stats entries={entries} />}
        </main>

        <nav className="bottom-nav">
          <button 
            className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <HomeIcon size={24} />
            <span>Check In</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'journal' ? 'active' : ''}`}
            onClick={() => setActiveTab('journal')}
          >
            <Book size={24} />
            <span>Journal</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <BarChart2 size={24} />
            <span>Stats</span>
          </button>
        </nav>
      </div>
    </div>
  );
}

export default App;
