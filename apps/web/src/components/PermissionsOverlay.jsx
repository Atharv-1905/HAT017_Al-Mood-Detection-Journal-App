import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, BellRing, ShieldCheck, Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

const STORAGE_KEY = 'mindtrace_permissions_granted';

/**
 * Check whether the user has already gone through the permissions flow.
 */
export function hasCompletedPermissions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed.completed === true;
  } catch {
    return false;
  }
}

/**
 * Read the persisted permission states.
 */
export function getPermissionStates() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

export default function PermissionsOverlay({ onComplete }) {
  const [step, setStep] = useState('intro'); // 'intro' | 'requesting' | 'done'
  const [cameraStatus, setCameraStatus] = useState('pending'); // 'pending' | 'granted' | 'denied'
  const [notifStatus, setNotifStatus] = useState('pending');
  const [busy, setBusy] = useState(false);

  async function requestAll() {
    setBusy(true);
    setStep('requesting');

    // 1. Camera ─────────────────────────────────────
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop the temporary stream immediately — LiveTracker will open its own later.
      stream.getTracks().forEach((t) => t.stop());
      setCameraStatus('granted');
    } catch {
      setCameraStatus('denied');
    }

    // 2. Notifications ──────────────────────────────
    try {
      const result = await Notification.requestPermission();
      setNotifStatus(result === 'granted' ? 'granted' : 'denied');
    } catch {
      setNotifStatus('denied');
    }

    setBusy(false);
    setStep('done');
  }

  function finish() {
    const state = {
      completed: true,
      camera: cameraStatus,
      notifications: notifStatus,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    onComplete(state);
  }

  const StatusIcon = ({ status }) =>
    status === 'granted' ? (
      <CheckCircle2 className="w-5 h-5 text-green-500" />
    ) : status === 'denied' ? (
      <XCircle className="w-5 h-5 text-red-400" />
    ) : (
      <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
    );

  return (
    <AnimatePresence>
      <motion.div
        key="perm-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4"
      >
        <motion.div
          initial={{ scale: 0.92, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/60 overflow-hidden"
        >
          {/* Header Gradient */}
          <div className="h-2 bg-gradient-to-r from-primary via-secondary to-primary" />

          <div className="p-8 flex flex-col items-center text-center">
            {/* ── INTRO ─────────────────────────────────── */}
            {step === 'intro' && (
              <>
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <ShieldCheck className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-text mb-2 tracking-tight">
                  Permissions Required
                </h2>
                <p className="text-text-light text-sm leading-relaxed max-w-sm mb-8">
                  MindTrace needs <strong>Camera</strong> and <strong>Notification</strong> access
                  to provide ambient background emotion sensing — even when you&apos;re on
                  another tab. Your data never leaves your device without consent.
                </p>

                <div className="w-full space-y-4 mb-8">
                  <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4 text-left">
                    <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 shrink-0">
                      <Camera size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text">Camera Access</p>
                      <p className="text-xs text-text-light">
                        Used for facial emotion analysis via the ambient live tracker.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4 text-left">
                    <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 shrink-0">
                      <BellRing size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text">Notification Access</p>
                      <p className="text-xs text-text-light">
                        Enables system-level stress alerts when you&apos;re in another tab or app.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={requestAll}
                  className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-full font-semibold text-lg hover:bg-green-500 hover:shadow-lg hover:shadow-green-200 transition-all active:scale-95"
                >
                  Grant Permissions <ArrowRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* ── REQUESTING ────────────────────────────── */}
            {step === 'requesting' && (
              <>
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-6" />
                <h2 className="text-xl font-bold text-text mb-2">Requesting access…</h2>
                <p className="text-text-light text-sm">
                  Please accept the browser prompts that appear.
                </p>
              </>
            )}

            {/* ── DONE ──────────────────────────────────── */}
            {step === 'done' && (
              <>
                <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-text mb-4 tracking-tight">
                  All Set!
                </h2>

                <div className="w-full space-y-3 mb-8">
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Camera size={18} className="text-blue-600" />
                      <span className="text-sm font-medium text-text">Camera</span>
                    </div>
                    <StatusIcon status={cameraStatus} />
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl px-5 py-3">
                    <div className="flex items-center gap-3">
                      <BellRing size={18} className="text-amber-600" />
                      <span className="text-sm font-medium text-text">Notifications</span>
                    </div>
                    <StatusIcon status={notifStatus} />
                  </div>
                </div>

                {(cameraStatus === 'denied' || notifStatus === 'denied') && (
                  <p className="text-xs text-red-500 mb-4">
                    Some permissions were denied. You can update them anytime in your browser settings.
                  </p>
                )}

                <button
                  onClick={finish}
                  className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-full font-semibold text-lg hover:bg-green-500 hover:shadow-lg hover:shadow-green-200 transition-all active:scale-95"
                >
                  Continue to MindTrace <ArrowRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
