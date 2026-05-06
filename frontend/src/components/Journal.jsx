import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit } from 'lucide-react';

export default function Journal({ entries }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="tab-container center-content">
        <h2>Your Journal</h2>
        <p className="empty-state">You haven't made any entries yet.<br/>Go to Check In to start!</p>
      </div>
    );
  }

  return (
    <div className="tab-container scrollable">
      <header className="header mb-4">
        <h2>Your Journey</h2>
      </header>
      
      <div className="journal-list">
        {entries.map((entry, index) => {
          const date = new Date(entry.date).toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric'
          });
          
          return (
            <motion.div 
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="journal-card"
            >
              <div className="journal-header">
                <span className="date">{date}</span>
                <span className={`emotion-badge ${entry.analysis.emotion}`}>
                  <BrainCircuit size={14} /> {entry.analysis.emotion}
                </span>
              </div>
              <p className="journal-text">"{entry.text}"</p>
              <div className="journal-footer">
                Wellness: <strong>{entry.analysis.wellness_index}</strong> | Risk: <span className={`risk-${entry.analysis.risk_level} capitalize`}>{entry.analysis.risk_level}</span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  );
}
