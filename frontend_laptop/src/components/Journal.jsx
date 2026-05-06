import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Edit2, Trash2, Check, X } from 'lucide-react';

export default function Journal({ entries, onEdit, onReanalyzeEdit, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [reanalyzePrompt, setReanalyzePrompt] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

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
              <div className="journal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="date" style={{ marginRight: '10px' }}>{date}</span>
                  <span className={`emotion-badge ${entry.analysis.emotion}`}>
                    <BrainCircuit size={14} /> {entry.analysis.emotion}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {editingId !== entry.id && (
                    <>
                      <button onClick={() => { setEditingId(entry.id); setEditText(entry.text); }} style={{ background: 'transparent', color: 'var(--text-muted)' }}><Edit2 size={16} /></button>
                      <button onClick={() => setDeleteConfirmId(entry.id)} style={{ background: 'transparent', color: '#F44336' }}><Trash2 size={16} /></button>
                    </>
                  )}
                </div>
              </div>

              {editingId === entry.id ? (
                <div style={{ marginTop: '10px' }}>
                  <textarea 
                    value={editText} 
                    onChange={(e) => setEditText(e.target.value)}
                    style={{ width: '100%', background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '10px', minHeight: '80px', marginBottom: '10px' }}
                  />
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={() => setEditingId(null)} style={{ background: 'transparent', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}><X size={16} /> Cancel</button>
                    <button onClick={() => { setReanalyzePrompt({ id: entry.id, text: editText }); setEditingId(null); }} style={{ background: 'var(--accent-color)', color: '#000', padding: '5px 15px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}><Check size={16} /> Save</button>
                  </div>
                </div>
              ) : (
                <p className="journal-text">"{entry.text}"</p>
              )}
              
              <div className="journal-footer" style={{ marginTop: '10px' }}>
                Wellness: <strong>{entry.analysis.wellness_index}</strong> | Risk: <span className={`risk-${entry.analysis.risk_level} capitalize`}>{entry.analysis.risk_level}</span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '24px', maxWidth: '350px', width: '90%', textAlign: 'center', border: '1px solid var(--card-border)' }}>
            <Trash2 size={40} color="#F44336" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ marginBottom: '1rem', fontSize: '1.4rem' }}>Are you sure?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
              This will permanently delete this journal entry. You cannot undo this action.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                style={{ flex: 1, padding: '1rem', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)', borderRadius: '30px', fontWeight: 'bold' }}
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
              <button 
                style={{ flex: 1, padding: '1rem', background: '#F44336', color: '#fff', borderRadius: '30px', fontWeight: 'bold', border: 'none' }}
                onClick={() => {
                  onDelete(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reanalyze Confirmation Modal */}
      {reanalyzePrompt && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '24px', maxWidth: '350px', width: '90%', textAlign: 'center', border: '1px solid var(--card-border)' }}>
            
            {analysisResult ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <BrainCircuit size={40} color="#4caf50" style={{ margin: '0 auto 1rem' }} />
                <h2 style={{ marginBottom: '1rem', fontSize: '1.4rem' }}>Analysis Complete!</h2>
                <div style={{ background: 'var(--input-bg)', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid var(--card-border)' }}>
                   <p style={{ marginBottom: '0.5rem' }}>Emotion: <strong style={{ color: 'var(--accent-color)', textTransform: 'capitalize' }}>{analysisResult.emotion}</strong></p>
                   <p style={{ marginBottom: '0.5rem' }}>Wellness: <strong>{analysisResult.wellness_index}/100</strong></p>
                   <p>Risk Level: <strong className={`risk-${analysisResult.risk_level}`} style={{ textTransform: 'capitalize' }}>{analysisResult.risk_level}</strong></p>
                </div>
                <button 
                  style={{ width: '100%', padding: '1rem', background: 'var(--accent-color)', color: '#000', borderRadius: '30px', fontWeight: 'bold', border: 'none' }}
                  onClick={() => { setAnalysisResult(null); setReanalyzePrompt(null); }}
                >
                  Ok
                </button>
              </motion.div>
            ) : (
              <>
                <BrainCircuit size={40} color="var(--accent-color)" style={{ margin: '0 auto 1rem' }} />
                <h2 style={{ marginBottom: '1rem', fontSize: '1.4rem' }}>Re-analyze Entry?</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  You modified the text. Would you like the AI to re-analyze your new emotions, or just save the text as is?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button 
                    disabled={isAnalyzing}
                    style={{ padding: '1rem', background: 'var(--accent-color)', color: '#000', borderRadius: '30px', fontWeight: 'bold', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                    onClick={async () => {
                      setIsAnalyzing(true);
                      const newStats = await onReanalyzeEdit(reanalyzePrompt.id, reanalyzePrompt.text);
                      setIsAnalyzing(false);
                      if (newStats) {
                        setAnalysisResult(newStats);
                      } else {
                        setReanalyzePrompt(null);
                      }
                    }}
                  >
                    {isAnalyzing ? <div className="loader" style={{ width: '20px', height: '20px', borderWidth: '3px', borderTopColor: '#000' }}></div> : "Re-Analyze & Save"}
                  </button>
                  <button 
                    disabled={isAnalyzing}
                    style={{ padding: '1rem', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-main)', borderRadius: '30px', fontWeight: 'bold' }}
                    onClick={() => {
                      onEdit(reanalyzePrompt.id, reanalyzePrompt.text);
                      setReanalyzePrompt(null);
                    }}
                  >
                    Save As Is
                  </button>
                  <button 
                    disabled={isAnalyzing}
                    style={{ padding: '0.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', marginTop: '0.5rem' }}
                    onClick={() => setReanalyzePrompt(null)}
                  >
                    Cancel Edit
                  </button>
                </div>
              </>
            )}
            
          </div>
        </div>
      )}

    </div>
  );
}
