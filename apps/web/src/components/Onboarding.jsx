import React, { useState } from 'react';
import { login, signup } from '../services/api';
import { emitToast } from '../services/toastBus';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, CheckCircle2, Leaf, Star, Monitor, BookOpen,
  Music, Code, Camera, Coffee, Mountain, Heart, Gamepad2, Bike, Palette,
  Dumbbell, Mic2, Globe, Brush, Compass, TreePine, Headphones, Utensils, Film
} from 'lucide-react';

const ACTIVITIES = [
  { id: 'reading', label: 'Reading', icon: BookOpen },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { id: 'yoga', label: 'Yoga', icon: Heart },
  { id: 'hiking', label: 'Hiking', icon: Mountain },
  { id: 'coding', label: 'Coding', icon: Code },
  { id: 'painting', label: 'Painting', icon: Palette },
  { id: 'cooking', label: 'Cooking', icon: Utensils },
  { id: 'running', label: 'Running', icon: Dumbbell },
  { id: 'music', label: 'Music', icon: Headphones },
  { id: 'gardening', label: 'Gardening', icon: Leaf },
  { id: 'movies', label: 'Movies', icon: Film },
  { id: 'photography', label: 'Photography', icon: Camera },
  { id: 'cricket', label: 'Cricket', icon: Globe },
  { id: 'cycling', label: 'Cycling', icon: Bike },
  { id: 'singing', label: 'Singing', icon: Mic2 },
  { id: 'meditation', label: 'Meditation', icon: Star },
  { id: 'sketching', label: 'Sketching', icon: Brush },
  { id: 'travel', label: 'Travel', icon: Compass },
  { id: 'coffee', label: 'Coffee Chats', icon: Coffee },
  { id: 'nature', label: 'Nature Walks', icon: TreePine },
  { id: 'writing', label: 'Writing', icon: BookOpen },
  { id: 'fitness', label: 'Gym / Fitness', icon: Dumbbell },
  { id: 'podcasts', label: 'Podcasts', icon: Monitor },
  { id: 'volunteering', label: 'Volunteering', icon: Heart },
];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', dob: '',
    interests: '', activities: [],
  });

  const updateForm = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const toggleActivity = (id) => {
    setFormData(prev => {
      const cur = prev.activities;
      return { ...prev, activities: cur.includes(id) ? cur.filter(a => a !== id) : [...cur, id] };
    });
  };

  const handleSubmitSignup = () => {
    (async () => {
      try {
        const emailPrefix = (formData.email.split('@')[0] || '').replace(/[^a-zA-Z0-9_]/g, '');
        const suffix = String(Date.now()).slice(-6);
        const generatedUsername = `${emailPrefix}${suffix}`;
        const username = (emailPrefix.length >= 3 ? emailPrefix : generatedUsername).slice(0, 50);

        const payload = {
          username,
          email: formData.email,
          password: formData.password,
          full_name: `${formData.firstName} ${formData.lastName}`.trim(),
        };
        const res = await signup(payload);
        // Expecting { token, user }
        if (res && res.user) {
          if (onComplete) onComplete(res.user);
        } else {
          // fallback
          if (onComplete) onComplete(formData);
        }
      } catch (e) {
        console.error('Signup error', e);
        emitToast('Signup failed. Please check your input and try again.', 'error');
      }
    })();
  };

  const handleLoginSubmit = () => {
    (async () => {
      try {
        const res = await login(formData.email, formData.password);
        if (res && res.user) {
          if (onComplete) onComplete(res.user);
        } else {
          window.alert('Login succeeded but no user payload returned.');
        }
      } catch (e) {
        console.error('Login failed', e);
        emitToast('Login failed. Check your credentials and backend.', 'error');
      }
    })();
  };

  const nextStep = () => setStep(s => Math.min(3, s + 1));
  const handleStepTwoNext = () => {
    const firstName = formData.firstName.trim();
    const email = formData.email.trim();
    const password = formData.password;

    if (!firstName) {
      emitToast('First name is required.', 'error');
      return;
    }
    if (!email) {
      emitToast('Email is required.', 'error');
      return;
    }
    if (!password) {
      emitToast('Password is required.', 'error');
      return;
    }
    if (password.length < 8) {
      emitToast('Password must be at least 8 characters.', 'error');
      return;
    }

    nextStep();
  };
  const prevStep = () => isLoginMode ? setIsLoginMode(false) : setStep(s => Math.max(1, s - 1));

  const variants = { initial: { opacity: 0, x: 30 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -30 } };

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all';

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl bg-surface rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden relative">

        {step > 1 && !isLoginMode && (
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-100 z-10">
            <motion.div className="h-full bg-primary" animate={{ width: `${((step - 1) / 2) * 100}%` }} transition={{ duration: 0.3 }} />
          </div>
        )}

        <div className="p-8 sm:p-12 min-h-[520px] flex flex-col">
          <AnimatePresence mode="wait">

            {/* ── STEP 1: Hero / Login ─────────────────────────── */}
            {step === 1 && (
              <motion.div key="s1" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.35 }}
                className="flex-1 flex flex-col items-center justify-center text-center space-y-8">

                {!isLoginMode ? (
                  <>
                    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center"><Leaf className="w-10 h-10 text-primary" /></div>
                    <div>
                      <h1 className="text-4xl sm:text-5xl font-bold text-text mb-4 tracking-tight">Your Mind's Best Friend.</h1>
                      <p className="text-lg text-text-light max-w-md mx-auto">A calm, intelligent space that adapts to your lifestyle, helping you track emotions and find balance every day.</p>
                    </div>
                    <div className="mt-6 flex flex-col sm:flex-row items-center gap-4 w-full justify-center max-w-md mx-auto">
                      <button onClick={() => setIsLoginMode(true)} className="w-full sm:w-auto px-8 py-4 bg-gray-100 text-text rounded-full font-semibold text-lg hover:bg-gray-200 transition-all active:scale-95">Login</button>
                      <button onClick={nextStep} className="w-full sm:w-auto flex items-center justify-center px-8 py-4 bg-primary text-white rounded-full font-semibold text-lg hover:bg-green-500 hover:shadow-lg hover:shadow-green-200 transition-all active:scale-95">
                        Sign Up <ArrowRight className="ml-2 w-5 h-5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="w-full max-w-sm mx-auto flex flex-col items-start text-left">
                    <button onClick={prevStep} className="text-text-light hover:text-text mb-8 transition-colors"><ArrowLeft className="w-6 h-6" /></button>
                    <h2 className="text-3xl font-bold text-text mb-2">Welcome Back</h2>
                    <p className="text-text-light mb-8">Enter your credentials to continue.</p>
                    <div className="w-full space-y-5">
                      <div><label className="block text-sm font-medium text-text mb-1">Email</label><input type="email" value={formData.email} onChange={e => updateForm('email', e.target.value)} className={inputCls} placeholder="jane@example.com" /></div>
                      <div><label className="block text-sm font-medium text-text mb-1">Password</label><input type="password" value={formData.password} onChange={e => updateForm('password', e.target.value)} className={inputCls} placeholder="••••••••" /></div>
                      <button onClick={handleLoginSubmit} disabled={!formData.email || !formData.password}
                        className="w-full mt-4 px-8 py-4 bg-primary text-white rounded-full font-semibold text-lg hover:bg-green-500 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">Submit</button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── STEP 2: Credentials ──────────────────────────── */}
            {step === 2 && (
              <motion.div key="s2" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.35 }} className="flex-1 flex flex-col">
                <button onClick={prevStep} className="self-start text-text-light hover:text-text mb-6 transition-colors"><ArrowLeft className="w-6 h-6" /></button>
                <h2 className="text-3xl font-bold text-text mb-2">Create your account</h2>
                <p className="text-text-light mb-8">Let's start with the basics.</p>
                <div className="space-y-5 flex-1">
                  <div className="flex flex-col sm:flex-row gap-5">
                    <div className="flex-1"><label className="block text-sm font-medium text-text mb-1">First Name</label><input type="text" value={formData.firstName} onChange={e => updateForm('firstName', e.target.value)} className={inputCls} placeholder="Jane" /></div>
                    <div className="flex-1"><label className="block text-sm font-medium text-text mb-1">Last Name</label><input type="text" value={formData.lastName} onChange={e => updateForm('lastName', e.target.value)} className={inputCls} placeholder="Doe" /></div>
                  </div>
                  <div><label className="block text-sm font-medium text-text mb-1">Email</label><input type="email" value={formData.email} onChange={e => updateForm('email', e.target.value)} className={inputCls} placeholder="jane@example.com" /></div>
                  <div><label className="block text-sm font-medium text-text mb-1">Password</label><input type="password" value={formData.password} onChange={e => updateForm('password', e.target.value)} className={inputCls} placeholder="••••••••" /></div>
                  <div><label className="block text-sm font-medium text-text mb-1">Date of Birth</label><input type="date" value={formData.dob} onChange={e => updateForm('dob', e.target.value)} className={`${inputCls} text-text`} /></div>
                </div>
                <div className="mt-8 flex justify-end">
                  <button onClick={handleStepTwoNext}
                    className="flex items-center px-8 py-3 bg-text text-white rounded-full font-medium hover:bg-gray-800 transition-colors">
                    Next Step <ArrowRight className="ml-2 w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: Personalization (20+ tags) ───────────── */}
            {step === 3 && (
              <motion.div key="s3" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.35 }} className="flex-1 flex flex-col">
                <button onClick={prevStep} className="self-start text-text-light hover:text-text mb-6 transition-colors"><ArrowLeft className="w-6 h-6" /></button>
                <h2 className="text-3xl font-bold text-text mb-2">Tell us about yourself</h2>
                <p className="text-text-light mb-6">So we can tailor your wellness journey.</p>
                <div className="space-y-6 flex-1 overflow-y-auto max-h-[420px] pr-1">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">Primary Interests & Goals</label>
                    <textarea value={formData.interests} onChange={e => updateForm('interests', e.target.value)}
                      className="w-full h-20 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all resize-none"
                      placeholder="e.g. Managing stress, improving focus, daily peace..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text mb-3">Free Time Activities <span className="text-gray-400 text-xs ml-1">({formData.activities.length} selected)</span></label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                      {ACTIVITIES.map(a => {
                        const Icon = a.icon;
                        const sel = formData.activities.includes(a.id);
                        return (
                          <button key={a.id} onClick={() => toggleActivity(a.id)}
                            className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${sel ? 'bg-secondary/10 border-secondary text-secondary shadow-sm' : 'bg-surface border-gray-100 text-text-light hover:border-gray-300 hover:bg-gray-50'}`}>
                            <Icon className={`w-5 h-5 mb-1.5 ${sel ? 'text-secondary' : 'text-gray-400'}`} />
                            <span className="text-[11px] font-medium leading-tight">{a.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="mt-8 flex justify-end">
                  <button onClick={handleSubmitSignup}
                    className="flex items-center px-8 py-3 bg-primary text-white rounded-full font-semibold hover:bg-green-500 hover:shadow-lg hover:shadow-green-200 transition-all">
                    Complete Sign Up <CheckCircle2 className="ml-2 w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
