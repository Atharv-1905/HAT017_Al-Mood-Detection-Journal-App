import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogOut, User, Mail, Calendar, ShieldCheck, Heart } from 'lucide-react';
import axios from 'axios';

export default function Profile({ onLogout }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pwdStatus, setPwdStatus] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("mindtrace_token");
        const res = await axios.get(`https://mindtrace-backend-ygob.onrender.com/api/auth/profile?token=${token}`);
        setProfile(res.data);
      } catch (err) {
        setError("Failed to load profile. Session might be expired.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="tab-container center-content">
        <div className="loader"></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="tab-container center-content">
        <p style={{ color: '#F44336' }}>{error}</p>
        <button onClick={onLogout} className="pulse-btn" style={{ marginTop: '1rem' }}>Return to Login</button>
      </div>
    );
  }

  let dateStr = profile.created_at;
  if (!dateStr.endsWith('Z')) {
    dateStr += 'Z';
  }

  const registeredDate = new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const interestsList = profile.interests ? profile.interests.split(',') : [];

  return (
    <div className="tab-container scrollable">
      <header className="header mb-4">
        <h2>My Profile</h2>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '24px', padding: '2rem', textAlign: 'center', marginBottom: '2rem' }}
      >
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-color), #a180ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '2rem', color: '#000', fontWeight: 'bold' }}>
          {profile.full_name.charAt(0).toUpperCase()}
        </div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>{profile.full_name}</h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <Mail size={14} /> {profile.email}
        </div>
      </motion.div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>

        <div style={{ background: 'var(--input-bg)', padding: '1.2rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(79, 209, 197, 0.1)', padding: '0.8rem', borderRadius: '12px' }}>
            <ShieldCheck size={24} color="var(--accent-color)" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Account Status</div>
            <div style={{ fontWeight: 'bold' }}>Verified Member</div>
          </div>
        </div>

        <div style={{ background: 'var(--input-bg)', padding: '1.2rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(161, 128, 255, 0.1)', padding: '0.8rem', borderRadius: '12px' }}>
            <Calendar size={24} color="#a180ff" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Registered On</div>
            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{registeredDate}</div>
          </div>
        </div>

      </div>

      <div style={{ marginBottom: '3rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Heart size={18} color="#ff80a1" /> My Interests
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
          {interestsList.length > 0 && interestsList[0] !== "" ? interestsList.map((interest, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.9rem' }}>
              {interest}
            </div>
          )) : (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>No interests selected.</span>
          )}
        </div>
      </div>

      <button
        onClick={() => setShowPasswordModal(true)}
        style={{ width: '100%', padding: '1rem', background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--text-main)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '1rem' }}
      >
        <LogOut size={20} /> Change Password
      </button>

      <button
        onClick={onLogout}
        style={{ width: '100%', padding: '1rem', background: 'transparent', border: '1px solid #F44336', color: '#F44336', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
      >
        <LogOut size={20} /> Logout
      </button>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '24px', maxWidth: '350px', width: '90%', border: '1px solid var(--card-border)' }}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.4rem', textAlign: 'center' }}>Change Password</h2>
            {pwdStatus && <p style={{ color: pwdStatus.includes('success') ? '#4caf50' : '#f44336', textAlign: 'center', marginBottom: '1rem' }}>{pwdStatus}</p>}
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ width: '100%', background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '10px', marginBottom: '1.5rem', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                style={{ flex: 1, padding: '1rem', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)', borderRadius: '30px', fontWeight: 'bold' }}
                onClick={() => { setShowPasswordModal(false); setPwdStatus(null); setNewPassword(''); }}
              >
                Cancel
              </button>
              <button
                style={{ flex: 1, padding: '1rem', background: 'var(--accent-color)', color: '#000', borderRadius: '30px', fontWeight: 'bold', border: 'none' }}
                onClick={async () => {
                  if (!newPassword) return;
                  try {
                    const token = localStorage.getItem("mindtrace_token");
                    await axios.put(`https://mindtrace-backend-ygob.onrender.com/api/auth/password?token=${token}`, { new_password: newPassword });
                    setPwdStatus('Password updated successfully!');
                    setTimeout(() => { setShowPasswordModal(false); setPwdStatus(null); setNewPassword(''); }, 2000);
                  } catch (err) {
                    setPwdStatus('Failed to update password');
                  }
                }}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
