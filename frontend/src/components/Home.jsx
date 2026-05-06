import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Sparkles, Send, Activity, BrainCircuit, Heart, ShieldAlert, ArrowLeft, Mic, MicOff } from 'lucide-react';

export default function Home({ onSaveEntry, isDemo, isAuthenticated, demoCount, onRequireLogin, onDemoAnalyze, userName }) {
  const [viewState, setViewState] = useState('landing');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef(null);
  const userWantsMicOnRef = useRef(false);

  // Compute Time of Day
  const hour = new Date().getHours();
  let timeOfDay = 'Morning';
  if (hour >= 12 && hour < 17) {
    timeOfDay = 'Afternoon';
  } else if (hour >= 17 && hour < 21) {
    timeOfDay = 'Evening';
  } else if (hour >= 21 || hour < 4) {
    timeOfDay = 'Night';
  }

  const toggleListening = () => {
    if (userWantsMicOnRef.current) {
      // Explicitly turn off
      userWantsMicOnRef.current = false;
      setIsListening(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice-to-Text is not supported in this browser. Please use Chrome or Safari.");
      return;
    }

    userWantsMicOnRef.current = true;
    setIsListening(true);

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onerror = (e) => {
      if (e.error !== 'no-speech') {
        console.error("Speech Error:", e);
      }
    };

    // CRITICAL: Chrome stops mic after pauses. We force it back on if user hasn't clicked Stop!
    recognition.onend = () => {
      if (userWantsMicOnRef.current) {
        try { recognition.start(); } catch (e) { }
      } else {
        setIsListening(false);
      }
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript) {
        setText((prev) => prev + finalTranscript);
      }
    };

    recognition.start();
  };

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);

    // Enforce Demo Limit
    if (isDemo && !isAuthenticated && demoCount >= 2) {
      onRequireLogin();
      return;
    }

    // Auto-turn off mic when they hit Analyze
    if (userWantsMicOnRef.current) {
      userWantsMicOnRef.current = false;
      setIsListening(false);
      if (recognitionRef.current) recognitionRef.current.stop();
    }

    try {
      if (isDemo && !isAuthenticated) {
        onDemoAnalyze();
      }
      const backendUrl = `https://mindtrace-backend-ygob.onrender.com/api/analyze`;
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

            <h2 className="greeting-text">Good {timeOfDay}{userName ? `, ${userName}` : ''}!</h2>
            <p className="greeting-subtext">Take a deep breath.<br />How are you feeling right now?</p>

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Express yourself</h2>

              {/* VOICE TO TEXT BUTTON */}
              <button
                onClick={toggleListening}
                style={{
                  background: isListening ? 'rgba(255,0,0,0.2)' : 'var(--input-bg)',
                  color: isListening ? '#ff4757' : 'var(--accent-color)',
                  border: isListening ? '1px solid #ff4757' : '1px solid var(--card-border)',
                  padding: '0.6rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s'
                }}
              >
                {isListening ? <Mic size={20} className="pulse-mic" /> : <MicOff size={20} />}
              </button>
            </div>

            <p style={{ color: isListening ? '#ff4757' : 'var(--text-muted)', transition: 'color 0.3s' }}>
              {isListening ? "Listening... Speak now!" : "Write or speak your thoughts honestly."}
            </p>

            <div className="textarea-wrapper" style={{ borderColor: isListening ? '#ff4757' : 'transparent' }}>
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
              <h3><Activity size={20} /> Suggestions</h3>
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
