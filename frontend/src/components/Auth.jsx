import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ChevronRight, Heart, ArrowLeft } from 'lucide-react';
import axios from 'axios';

const INTERESTS_OPTIONS = ["Mental Health", "Fitness", "Meditation", "Journaling", "Productivity", "Therapy", "Sleep Tracking"];

export default function Auth({ onLogin, onDemo }) {
  const [view, setView] = useState('landing'); // 'landing' | 'auth'
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '' });
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForgotPwd, setShowForgotPwd] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState(null);
  const [resetPasswordStr, setResetPasswordStr] = useState('');

  const hour = new Date().getHours();
  let timeOfDay = 'Morning';
  if (hour >= 12 && hour < 17) {
    timeOfDay = 'Afternoon';
  } else if (hour >= 17 && hour < 21) {
    timeOfDay = 'Evening';
  } else if (hour >= 21 || hour < 4) {
    timeOfDay = 'Night';
  }

  const toggleInterest = (interest) => {
    setSelectedInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const backendUrl = `https://mindtrace-backend-ygob.onrender.com/api/auth/${isLogin ? 'login' : 'register'}`;
      const payload = isLogin ? { email: formData.email, password: formData.password } : { ...formData, interests: selectedInterests };
      const res = await axios.post(backendUrl, payload);
      localStorage.setItem("mindtrace_token", res.data.access_token);
      onLogin();
    } catch (err) {
      setError(err.response?.data?.detail || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab-container flex-col" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '100vh', paddingBottom: '0' }}>
      <AnimatePresence mode="wait">

        {view === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="landing-container center-content flex-col"
            style={{ width: '100%' }}
          >
            <motion.div
              className="floating-blob"
              animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="blob-inner">
                <Heart size={48} className="blob-icon" />
              </div>
            </motion.div>

            <h2 className="greeting-text">Good {timeOfDay}!</h2>
            <p className="greeting-subtext">Take a deep breath.<br />Welcome to MindTrace AI.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '300px' }}>
              <button className="pulse-btn" onClick={() => setView('auth')} style={{ width: '100%' }}>
                Register / Login
              </button>
              <button
                onClick={onDemo}
                style={{ background: 'transparent', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', padding: '1rem', borderRadius: '30px', fontWeight: 'bold' }}
              >
                Try Demo Mode
              </button>
            </div>
          </motion.div>
        )}

        {view === 'auth' && (
          <motion.div
            key="auth"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ width: '100%', maxWidth: '400px', background: 'var(--card-bg)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--card-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
          >
            <button className="back-btn" onClick={() => setView('landing')} style={{ marginBottom: '1.5rem', background: 'var(--input-bg)' }}>
              <ArrowLeft size={20} />
            </button>

            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.4rem' }}>{isLogin ? "Welcome Back" : "Create Account"}</h2>

            {error && (
              <div style={{ background: 'rgba(244, 67, 54, 0.1)', color: '#F44336', padding: '0.8rem', borderRadius: '12px', marginBottom: '1rem', fontSize: '0.9rem', border: '1px solid rgba(244, 67, 54, 0.3)' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              <AnimatePresence>
                {!isLogin && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                    <div className="textarea-wrapper" style={{ display: 'flex', alignItems: 'center', padding: '0.8rem 1rem', marginBottom: 0 }}>
                      <User size={20} color="var(--text-muted)" style={{ marginRight: '1rem' }} />
                      <input
                        type="text" placeholder="Full Name" required
                        value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none' }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="textarea-wrapper" style={{ display: 'flex', alignItems: 'center', padding: '0.8rem 1rem', marginBottom: 0 }}>
                <Mail size={20} color="var(--text-muted)" style={{ marginRight: '1rem' }} />
                <input
                  type="email" placeholder="Email Address" required
                  value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none' }}
                />
              </div>

              <div className="textarea-wrapper" style={{ display: 'flex', alignItems: 'center', padding: '0.8rem 1rem', marginBottom: 0 }}>
                <Lock size={20} color="var(--text-muted)" style={{ marginRight: '1rem' }} />
                <input
                  type="password" placeholder="Password" required
                  value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none' }}
                />
              </div>

              {!isLogin && (
                <div style={{ marginTop: '0.5rem' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Select your interests:</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {INTERESTS_OPTIONS.map(interest => (
                      <div
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        style={{
                          padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', cursor: 'pointer',
                          border: `1px solid ${selectedInterests.includes(interest) ? 'var(--accent-color)' : 'var(--card-border)'}`,
                          background: selectedInterests.includes(interest) ? 'rgba(102, 252, 241, 0.1)' : 'var(--input-bg)',
                          color: selectedInterests.includes(interest) ? 'var(--accent-color)' : 'var(--text-muted)',
                          transition: 'all 0.2s'
                        }}
                      >
                        {interest}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading} className="analyze-btn" style={{ marginTop: '1rem' }}>
                {loading ? <div className="loader" style={{ width: '15px', height: '15px', borderWidth: '2px' }}></div> : (isLogin ? 'Login' : 'Create Account')}
                {!loading && <ChevronRight size={18} />}
              </button>
            </form>

            {isLogin && (
              <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem' }}>
                <span onClick={() => setShowForgotPwd(true)} style={{ color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }}>
                  Forgot Password?
                </span>
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span onClick={() => { setIsLogin(!isLogin); setError(null); }} style={{ color: 'var(--accent-color)', fontWeight: 'bold', cursor: 'pointer' }}>
                {isLogin ? "Sign Up" : "Login"}
              </span>
            </div>
          </motion.div>
        )}

        {/* Forgot Password Modal */}
        {showForgotPwd && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '24px', maxWidth: '350px', width: '90%', border: '1px solid var(--card-border)' }}>
              <h2 style={{ marginBottom: '1rem', fontSize: '1.4rem', textAlign: 'center' }}>Reset Password</h2>
              {forgotStatus && <p style={{ color: '#4caf50', textAlign: 'center', marginBottom: '1rem' }}>{forgotStatus}</p>}
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '1rem' }}>Enter your email address and we will send you a reset link.</p>
              <input
                type="email"
                placeholder="Email Address"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                style={{ width: '100%', background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '10px', marginBottom: '1.5rem', outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  style={{ flex: 1, padding: '1rem', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)', borderRadius: '30px', fontWeight: 'bold' }}
                  onClick={() => { setShowForgotPwd(false); setForgotStatus(null); setForgotEmail(''); }}
                >
                  Cancel
                </button>
                <button
                  style={{ flex: 1, padding: '1rem', background: 'var(--accent-color)', color: '#000', borderRadius: '30px', fontWeight: 'bold', border: 'none' }}
                  onClick={() => {
                    if (!forgotEmail) return;
                    setForgotStatus(
                      <div style={{ color: '#4caf50', padding: '10px', background: 'rgba(76, 175, 80, 0.1)', borderRadius: '12px' }}>
                        System Mock Link Generated:<br />
                        <button onClick={() => {
                          setShowForgotPwd(false);
                          setView('reset_password');
                        }} style={{ color: 'var(--accent-color)', background: 'transparent', border: 'none', textDecoration: 'underline', marginTop: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                          [Click Here to Reset Password]
                        </button>
                      </div>
                    );
                  }}
                >
                  Send Link
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reset Password View */}
        {view === 'reset_password' && (
          <motion.div
            key="reset"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ width: '100%', maxWidth: '400px', background: 'var(--card-bg)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--card-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
          >
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.4rem', textAlign: 'center' }}>Reset Your Password</h2>

            {error && (
              <div style={{ background: 'rgba(244, 67, 54, 0.1)', color: '#F44336', padding: '0.8rem', borderRadius: '12px', marginBottom: '1rem', fontSize: '0.9rem', border: '1px solid rgba(244, 67, 54, 0.3)' }}>
                {error}
              </div>
            )}

            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
              Setting new password for:<br /><strong style={{ color: 'var(--text-main)' }}>{forgotEmail}</strong>
            </p>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              setError(null);
              try {
                await axios.post(`https://mindtrace-backend-ygob.onrender.com/api/auth/reset-password`, {
                  email: forgotEmail,
                  new_password: resetPasswordStr
                });
                setView('auth');
                setIsLogin(true);
                setResetPasswordStr('');
              } catch (err) {
                setError(err.response?.data?.detail || "Failed to reset password.");
              } finally {
                setLoading(false);
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="textarea-wrapper" style={{ display: 'flex', alignItems: 'center', padding: '0.8rem 1rem', marginBottom: 0 }}>
                <Lock size={20} color="var(--text-muted)" style={{ marginRight: '1rem' }} />
                <input
                  type="password" placeholder="Enter New Password" required
                  value={resetPasswordStr} onChange={(e) => setResetPasswordStr(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none' }}
                />
              </div>

              <button type="submit" disabled={loading} className="analyze-btn" style={{ marginTop: '1rem' }}>
                {loading ? <div className="loader" style={{ width: '15px', height: '15px', borderWidth: '2px' }}></div> : 'Save New Password'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
              <span onClick={() => { setView('auth'); setIsLogin(true); }} style={{ color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }}>
                Return to Login
              </span>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
