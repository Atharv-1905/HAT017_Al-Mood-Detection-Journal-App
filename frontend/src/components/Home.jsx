import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Sparkles, Send, Activity, BrainCircuit, Heart, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function Home({ onSaveEntry }) {
  // viewState can be: 'landing', 'input', 'result'
  const [viewState, setViewState] = useState('landing');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const backendUrl = `http://${window.location.hostname}:8000/api/analyze`;
      const response = await axios.post(backendUrl, {
        text: text,
      });
      const data = response.data;
      setResult(data);
      setViewState('result');
      
      onSaveEntry({
        id: Date.now().toString(),
        text: text,
        date: new Date().toISOString(),
        analysis: data
      });
      setLoading(false);

    } catch (error) {
      console.error("Backend not ready yet, falling back to mock AI for demo!", error);
      setTimeout(() => {
        const mockData = {
          emotion: text.toLowerCase().includes('sad') ? 'sadness' : (text.toLowerCase().includes('angry') ? 'anger' : 'joy'),
          confidence: 0.92,
          sentiment: text.toLowerCase().includes('sad') || text.toLowerCase().includes('angry') ? -0.7 : 0.85,
          wellness_index: text.toLowerCase().includes('sad') || text.toLowerCase().includes('angry') ? 35 : 85,
          risk_level: text.toLowerCase().includes('sad') || text.toLowerCase().includes('angry') ? 'medium' : 'low',
          trigger_intervention: false,
          suggestions: [
            "Take a moment to check in with your posture and breath.",
            "Would you like to listen to a calming playlist?",
            "Remember that your feelings are valid and temporary."
          ],
          timestamp: new Date().toISOString()
        };
        setResult(mockData);
        setViewState('result');
        onSaveEntry({
          id: Date.now().toString(),
          text: text,
          date: new Date().toISOString(),
          analysis: mockData
        });
        setLoading(false);
      }, 1500); 
    }
  };

  const resetHome = () => {
    setResult(null);
    setText('');
    setViewState('landing');
  };

  return (
    <div className="tab-container">
      <header className="header">
        <Sparkles className="logo-icon" />
        <h1>MindTrace</h1>
      </header>
      
      <AnimatePresence mode="wait">
        
        {/* LANDING VIEW */}
        {viewState === 'landing' && (
          <motion.div 
            key="landing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="landing-container center-content flex-col"
          >
            <motion.div 
              className="floating-blob"
              animate={{ 
                y: [0, -20, 0],
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 5, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="blob-inner">
                <Heart size={48} className="blob-icon" />
              </div>
            </motion.div>
            
            <h2 className="greeting-text">Good {timeOfDay}!</h2>
            <p className="greeting-subtext">Take a deep breath.<br/>How are you feeling right now?</p>
            
            <button 
              className="pulse-btn"
              onClick={() => setViewState('input')}
            >
              Start Check-In
            </button>
          </motion.div>
        )}

        {/* INPUT VIEW */}
        {viewState === 'input' && (
          <motion.div 
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="input-container"
          >
            <button className="back-btn" onClick={() => setViewState('landing')}>
              <ArrowLeft size={20} />
            </button>
            <h2>Express yourself</h2>
            <p>Write your thoughts honestly. Our AI is here to listen.</p>
            
            <div className="textarea-wrapper">
              <textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="I'm feeling..."
                rows={6}
                autoFocus
              />
            </div>
            
            <button 
              className="analyze-btn" 
              onClick={handleAnalyze}
              disabled={loading || !text.trim()}
            >
              {loading ? (
                <span className="loader"></span>
              ) : (
                <>
                  <span>Analyze Mood</span>
                  <Send size={18} />
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* RESULT VIEW */}
        {viewState === 'result' && result && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="result-container"
          >
            <div className="result-header">
              <h2>Check-in Complete</h2>
              <button className="reset-btn" onClick={resetHome}>
                Done
              </button>
            </div>

            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon emotion"><BrainCircuit size={24} /></div>
                <div className="metric-info">
                  <span className="label">Emotion</span>
                  <span className="value capitalize">{result.emotion}</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon wellness"><Heart size={24} /></div>
                <div className="metric-info">
                  <span className="label">Wellness</span>
                  <span className="value">{result.wellness_index}/100</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon risk"><ShieldAlert size={24} /></div>
                <div className="metric-info">
                  <span className="label">Risk Level</span>
                  <span className={`value capitalize risk-${result.risk_level}`}>{result.risk_level}</span>
                </div>
              </div>
            </div>

            <div className="suggestions-card">
              <h3><Activity size={20}/> Suggestions</h3>
              <ul>
                {result.suggestions.map((suggestion, idx) => (
                  <motion.li 
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    {suggestion}
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
