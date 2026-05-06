import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Bell, X, Wind, BellRing } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { postLiveFrame } from '../services/visionService';
import { saveFacialLog as apiSaveFacialLog } from '../services/api';
import BreathingIntervention from './BreathingIntervention';

export default function LiveTracker() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const workerRef = useRef(null);
  const streamRef = useRef(null);
  const [enabled, setEnabled] = useState(true);
  const [lastAlert, setLastAlert] = useState(null);
  const [showIntervention, setShowIntervention] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [isHidden, setIsHidden] = useState(document.hidden);
  const [lastCapture, setLastCapture] = useState(null);

  // ─── TASK 2: Visibility change tracking ────────────────────
  useEffect(() => {
    const onVisChange = () => setIsHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisChange);
    return () => document.removeEventListener('visibilitychange', onVisChange);
  }, []);

  // ─── Capture + analyse a single frame ──────────────────────
  const captureAndSend = useCallback(async () => {
    try {
      const video = videoRef.current;
      // When tab is hidden, the <video> element may be paused by the browser.
      // We still have a live MediaStream (streamRef) — use an ImageCapture
      // fallback or grab whatever the canvas produces. If the video is paused
      // we try to keep it playing.
      if (!video) return;

      // Ensure the video keeps playing even when hidden
      if (video.paused && streamRef.current) {
        try { await video.play(); } catch { /* ignore - autoplay policy */ }
      }

      if (!canvasRef.current) canvasRef.current = document.createElement('canvas');
      const canvas = canvasRef.current;
      const vw = video.videoWidth || 320;
      const vh = video.videoHeight || 240;
      canvas.width = vw;
      canvas.height = vh;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, vw, vh);

      // Verify the frame is not blank (all-black = paused video in background)
      const sample = ctx.getImageData(0, 0, Math.min(vw, 16), Math.min(vh, 16)).data;
      const sum = sample.reduce((a, b) => a + b, 0);
      if (sum === 0) {
        // Frame is blank — browser has frozen video rendering.
        // Still send a "heartbeat" capture to keep the pipeline alive,
        // but also try an ImageCapture API fallback if available.
        const track = streamRef.current?.getVideoTracks?.()?.[0];
        if (track && typeof ImageCapture !== 'undefined') {
          try {
            const ic = new ImageCapture(track);
            const bitmap = await ic.grabFrame();
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            ctx.drawImage(bitmap, 0, 0);
            bitmap.close();
          } catch {
            // ImageCapture not available or failed — skip this cycle
            console.debug('LiveTracker: background frame capture unavailable this cycle');
            return;
          }
        } else {
          return; // No way to grab a frame right now
        }
      }

      const imageSrc = canvas.toDataURL('image/jpeg', 0.8);
      if (!imageSrc || imageSrc.length < 100) return;

      setLastCapture(new Date());
      const res = await postLiveFrame(imageSrc);

      // ─── TASK 3: Distress routing ─────────────────────────
      if (res && res.distress_level === 'high') {
        if (document.hidden) {
          // User is on another tab/app → send OS notification
          sendNativeNotification(res);
        } else {
          // User is looking at the app → show in-app UI
          setLastAlert(res);
          setShowIntervention(true);
        }
      }
    } catch (e) {
      // Only log in development, don't spam console every 15s
      if (!document.hidden) {
        console.error('LiveTracker capture failed', e);
      }
    }
  }, []);

  // ─── Camera lifecycle + Web Worker timer ───────────────────
  useEffect(() => {
    if (!enabled) return;

    let mounted = true;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
          audio: false,
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        if (mounted) {
          captureAndSend();

          // Web Worker keeps ticking even when tab is backgrounded
          const workerCode = `
            let interval;
            self.onmessage = function(e) {
              if (e.data.command === 'start') {
                interval = setInterval(() => self.postMessage('tick'), e.data.interval);
              } else if (e.data.command === 'stop') {
                clearInterval(interval);
              }
            };
          `;
          const blob = new Blob([workerCode], { type: 'application/javascript' });
          const worker = new Worker(URL.createObjectURL(blob));
          workerRef.current = worker;

          worker.onmessage = () => {
            if (mounted) captureAndSend();
          };
          worker.postMessage({ command: 'start', interval: 15000 });
        }
      } catch (err) {
        console.warn('Camera permission denied or unavailable', err);
      }
    };
    start();

    return () => {
      mounted = false;
      if (workerRef.current) {
        workerRef.current.postMessage({ command: 'stop' });
        workerRef.current.terminate();
        workerRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // ─── TASK 3: Native notification sender ────────────────────
  function sendNativeNotification(res) {
    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted, cannot send OS alert');
      return;
    }

    const notif = new Notification('MindTrace Alert 🧠', {
      body: `You seem stressed (${res.predicted_emotion || 'distress'} detected at ${Math.round((res.confidence_score || 0) * 100)}% confidence). Click here for a quick breathing exercise.`,
      icon: '/favicon.svg',
      tag: 'mindtrace-distress', // prevents flooding
      requireInteraction: true,
    });

    notif.onclick = () => {
      // Focus the MindTrace tab and open breathing UI
      window.focus();
      setShowBreathing(true);
      notif.close();
    };
  }

  // ─── Test notification (for verifying setup works) ─────────
  function sendTestNotification() {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          fireTest();
        }
      });
      return;
    }
    fireTest();
  }

  function fireTest() {
    const notif = new Notification('MindTrace Test 🧪', {
      body: 'Notifications are working! Switch tabs and wait 15 seconds to receive real alerts.',
      icon: '/favicon.svg',
      tag: 'mindtrace-test',
    });
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
  }

  // ─── Intervention handlers ─────────────────────────────────
  function closeIntervention() {
    setShowIntervention(false);
    if (lastAlert?.timestamp) {
      apiSaveFacialLog({
        timestamp: lastAlert.timestamp,
        predicted_emotion: lastAlert.predicted_emotion,
        confidence_score: lastAlert.confidence_score,
        recommended_action_taken: 'dismissed',
      }).catch(console.warn);
    }
    setLastAlert(null);
  }

  function takeAction() {
    if (!lastAlert) return;
    apiSaveFacialLog({
      timestamp: lastAlert.timestamp,
      predicted_emotion: lastAlert.predicted_emotion,
      confidence_score: lastAlert.confidence_score,
      recommended_action_taken: 'taken',
    }).catch(console.warn);
    setShowIntervention(false);
    setLastAlert(null);
    setShowBreathing(true);
  }

  return (
    <>
      {/* ── Corner webcam pip ──────────────────────────────── */}
      <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2">
        <div className="relative w-36 rounded-xl overflow-hidden border border-gray-200 shadow-lg bg-black/10">
          <video ref={videoRef} className="w-full h-24 object-cover bg-black" playsInline muted />
          {/* Visibility indicator dot */}
          <div className={`absolute top-2 left-2 w-2.5 h-2.5 rounded-full ${isHidden ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`} />
          {/* Last capture timestamp */}
          {lastCapture && (
            <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-md font-mono">
              {lastCapture.toLocaleTimeString()}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEnabled((v) => !v)}
            className={`rounded-full px-3 py-1 text-sm shadow-sm border border-gray-100 transition-all ${
              enabled ? 'bg-white/90 text-text' : 'bg-gray-200 text-gray-500'
            }`}
          >
            {enabled ? (isHidden ? 'Background' : 'Tracking On') : 'Tracking Off'}
          </button>
          {enabled && (
            <button
              onClick={sendTestNotification}
              title="Send a test notification to verify OS alerts"
              className="rounded-full p-1.5 bg-white/90 shadow-sm border border-gray-100 hover:bg-amber-50 transition-colors"
            >
              <BellRing size={14} className="text-amber-600" />
            </button>
          )}
        </div>
      </div>

      {/* ── Floating intervention toast ────────────────────── */}
      <AnimatePresence>
        {showIntervention && lastAlert && (
          <motion.div
            key="intervention"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed left-6 bottom-6 z-[60] w-96 rounded-2xl border border-gray-200 bg-white/95 backdrop-blur-xl p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-red-50 p-2.5 text-red-600">
                  <Bell size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text">Quick Relief Suggested</p>
                  <p className="text-xs text-gray-600">
                    We detected <span className="font-medium">{lastAlert.predicted_emotion}</span> with
                    confidence {Math.round((lastAlert.confidence_score || 0) * 100)}%
                  </p>
                </div>
              </div>
              <button onClick={closeIntervention} className="rounded-md p-1 text-gray-500 hover:bg-gray-100">
                <X size={16} />
              </button>
            </div>

            <div className="mt-3">
              {lastAlert.recommended_action === 'show_youtube' && (
                <div className="aspect-video w-full overflow-hidden rounded-xl border border-gray-100">
                  <iframe
                    title="Relief Video"
                    src="https://www.youtube.com/embed/DbDoBzGY3vo?autoplay=1&rel=0"
                    className="w-full h-full"
                    allow="autoplay; encrypted-media"
                  />
                </div>
              )}
              {lastAlert.recommended_action === 'show_gifs' && (
                <div className="w-full flex items-center justify-center">
                  <img
                    src="https://media.giphy.com/media/3o6ZtpxSZbQRRnwCKQ/giphy.gif"
                    alt="breathing"
                    className="w-full rounded-xl"
                  />
                </div>
              )}
              {(!lastAlert.recommended_action || lastAlert.recommended_action === 'none') && (
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl">
                  Try a 60-second breathing exercise: Breathe in 4s, hold 4s, out 6s.
                </p>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={closeIntervention} className="rounded-full px-4 py-2 bg-gray-100 text-sm font-medium hover:bg-gray-200 transition-colors">
                Dismiss
              </button>
              <button onClick={takeAction} className="rounded-full px-4 py-2 bg-primary text-white text-sm font-medium flex items-center gap-1.5 hover:bg-green-500 transition-colors">
                <Wind size={14} /> Breathe
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Full-screen Breathing exercise ─────────────────── */}
      <AnimatePresence>
        {showBreathing && (
          <BreathingIntervention onComplete={() => setShowBreathing(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
