import React, { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { analyzeLive, triggerSOS, saveJournal } from '../services/api';
import BreathingIntervention from './BreathingIntervention';
import { Activity, ShieldAlert, Loader2, AlertCircle, TrendingUp, TrendingDown, Save, CheckCircle, Mic, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PROMPTS = [
  "What is something that made you smile today?",
  "Describe a challenge you faced recently and how you handled it.",
  "What are three things you're grateful for right now?",
  "How are you prioritizing your mental health today?",
  "What is a goal you are working towards this week?",
  "If your current mood were a color, what would it be and why?"
];

export default function Journal() {
  const [text, setText] = useState('');
  const debouncedText = useDebounce(text, 1000);
  const [analysis, setAnalysis] = useState(null);
  const [isIntervening, setIsIntervening] = useState(false);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dailyPrompt] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);

  useEffect(() => {
    if (!debouncedText.trim()) { setAnalysis(null); return; }
    if (isIntervening || sosTriggered) return;

    (async () => {
      setIsAnalyzing(true);
      try {
        const result = await analyzeLive(debouncedText);
        setAnalysis(result);
        const wordCount = debouncedText.trim().split(/\s+/).length;
        if (result.risk_level === 'high' || result.risk_level === 'critical') {
          if (!sosTriggered) { setSosTriggered(true); await triggerSOS(); }
        } else if (result.trigger_intervention && (wordCount >= 4 || debouncedText.length >= 20)) {
          setIsIntervening(true);
        }
      } catch (err) { console.error('Analysis failed:', err); }
      finally { setIsAnalyzing(false); }
    })();
  }, [debouncedText]);

  const handleSave = async () => {
    if (!text.trim()) return;
    setIsSaving(true);
    try { await saveJournal(text, analysis); } catch (e) { console.error(e); }
    setText(''); setAnalysis(null); setIsSaving(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const wellnessColor = (s) => s >= 70 ? 'text-green-600 bg-green-50 border-green-100' : s >= 40 ? 'text-yellow-600 bg-yellow-50 border-yellow-100' : 'text-red-600 bg-red-50 border-red-100';

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 flex flex-col lg:flex-row gap-8 relative animate-fade-in">

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center bg-green-50 border border-green-200 text-green-700 px-6 py-3 rounded-full shadow-lg">
            <CheckCircle className="w-5 h-5 mr-2" /><span className="font-medium">Journal Entry Saved!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        <h2 className="text-2xl font-semibold text-text mb-1">Write your day here</h2>
        <p className="text-text-light mb-6 text-sm">MindTrace senses your emotions in real-time as you write.</p>

        <div className="bg-blue-50/50 border border-blue-100/50 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-blue-800 text-xs font-bold uppercase tracking-wider mb-1">Daily Prompt</h4>
            <p className="text-blue-900 text-sm">{dailyPrompt}</p>
          </div>
        </div>

        <div className="relative flex-1 min-h-[400px]">
          <textarea value={text} onChange={e => setText(e.target.value)} disabled={isIntervening || sosTriggered || isSaving}
            placeholder="How are you feeling right now…?"
            className="w-full h-full p-6 text-lg bg-surface rounded-3xl border border-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all placeholder:text-gray-300" />
          <div className="absolute bottom-4 right-4 flex items-center gap-3">
            {/* Record Audio mock icon */}
            <button title="Record Audio (coming soon)" className="p-2 rounded-full bg-gray-50 border border-gray-100 text-gray-400 hover:text-secondary transition-colors">
              <Mic className="w-4 h-4" />
            </button>
            {isAnalyzing ? (
              <span className="flex items-center text-sm text-gray-400"><Loader2 className="w-4 h-4 mr-1 animate-spin" />Sensing…</span>
            ) : text.length > 0 ? (
              <span className="text-primary flex items-center text-sm"><AlertCircle className="w-4 h-4 mr-1" />Live</span>
            ) : null}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end mt-5">
          <button onClick={handleSave} disabled={!text.trim() || isSaving}
            className="flex items-center px-7 py-3.5 bg-primary text-white rounded-full font-semibold hover:bg-green-500 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md">
            {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
            {isSaving ? 'Saving…' : 'Save Journal'}
          </button>
        </div>
      </div>

      {/* Sensing Sidebar */}
      <div className="w-full lg:w-80">
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-medium text-text flex items-center mb-5"><Activity className="w-5 h-5 mr-2 text-secondary" />Live Sensing</h3>

          {analysis ? (
            <div className="space-y-5 animate-fade-in">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Emotion</p>
                <div className="inline-flex items-center px-4 py-2 rounded-2xl bg-gray-50 border border-gray-100">
                  <span className="text-lg font-medium capitalize text-text">{analysis.emotion}</span>
                  <span className="ml-2 text-xs text-gray-400">({Math.round(analysis.confidence * 100)}%)</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Wellness</p>
                <div className={`flex items-center p-4 rounded-2xl border ${wellnessColor(analysis.wellness_index)}`}>
                  {analysis.wellness_index >= 50 ? <TrendingUp className="w-6 h-6 mr-3" /> : <TrendingDown className="w-6 h-6 mr-3" />}
                  <span className="text-3xl font-bold">{analysis.wellness_index}</span><span className="ml-1 text-sm opacity-70">/100</span>
                </div>
              </div>
              {analysis.suggestions?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Suggestions</p>
                  <ul className="space-y-2">
                    {analysis.suggestions.map((s, i) => <li key={i} className="text-sm text-text-light bg-gray-50 p-3 rounded-xl border border-gray-100">{s}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center text-gray-400 space-y-3">
              <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100"><AlertCircle className="w-7 h-7 opacity-50" /></div>
              <p className="text-sm text-center">Start typing to see<br />real-time insights.</p>
            </div>
          )}
        </div>
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {isIntervening && <BreathingIntervention onComplete={() => { setIsIntervening(false); setAnalysis(null); }} />}
        {sosTriggered && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border-l-4 border-red-500 z-50">
            <div className="flex items-start">
              <ShieldAlert className="w-8 h-8 text-red-500 mr-4 shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Safety Guardrail Activated</h3>
                <p className="text-gray-600 mb-4 text-sm">We've detected high distress. You are not alone. Emergency contacts notified.</p>
                <div className="space-y-2">
                  <a href="tel:988" className="block w-full text-center py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors">Call 988 Lifeline</a>
                  <button onClick={() => { setSosTriggered(false); }} className="block w-full text-center py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">I am safe now</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
