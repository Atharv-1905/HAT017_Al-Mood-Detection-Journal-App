import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';
import { Camera, Video, Music, XCircle, Heart, AlertCircle, ExternalLink, X, Laptop, BookOpen, Coffee, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LiveTracker() {
  const videoRef = useRef(null);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [emotion, setEmotion] = useState(null);
  const [activity, setActivity] = useState("Scanning Environment...");
  const [suggestion, setSuggestion] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [transcript, setTranscript] = useState("");
  
  const objectModelRef = useRef(null);
  const triggerHistoryRef = useRef({}); // Tracks when each specific popup was last shown
  const recognitionRef = useRef(null);

  // Ultimate Universal Context Engine Recommendations
  const recommendations = {
    // OBJECT/ACTIVITY DETECTIONS
    cellphone: {
      type: "text",
      title: "📱 Cell Phone Detected!",
      content: "Mindless scrolling can increase anxiety. Try to put it down and stretch your neck!",
      actionText: "",
      icon: <Smartphone size={40} color="#ffb347"/>
    },
    hydration: {
      type: "text",
      title: "💧 Water Bottle Detected!",
      content: "Great job drinking! Staying hydrated drastically improves your mood and brain power.",
      actionText: "",
      icon: <Coffee size={40} color="#4fd1c5"/>
    },
    reading: {
      type: "link",
      title: "📖 Book Detected!",
      content: "https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ",
      actionText: "Play Ambient Study Music",
      icon: <BookOpen size={40} color="#a180ff"/>
    },
    typing: {
      type: "link",
      title: "💻 Laptop/Keyboard Detected!",
      content: "https://www.youtube.com/watch?v=jfKfPfyJRdk", 
      actionText: "Play Lofi Study Beats",
      icon: <Laptop size={40} color="#4fd1c5"/>
    },
    // EMOTIONAL DETECTIONS
    sad: {
      type: "link",
      title: "😢 Sadness Detected",
      content: "https://www.youtube.com/watch?v=31g0YE61PLQ",
      actionText: "Watch Funny Video 🍿",
      icon: <Video size={40} color="#FF0000"/>
    },
    angry: {
      type: "link",
      title: "😠 Anger Detected",
      content: "https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0ExPn",
      actionText: "Open Calming Playlist 🎧",
      icon: <Music size={40} color="#1DB954"/>
    },
    fearful: {
      type: "text",
      title: "😰 Anxiety Spike Detected",
      content: "Name 5 things you can see right now. Then take 3 deep breaths.",
      icon: <AlertCircle size={40} color="#ffb347"/>
    },
    happy: {
      type: "text",
      title: "😊 Radiating Joy Detected!",
      content: "Whatever you are doing, keep it up! Your energy is great.",
      icon: <Heart size={40} color="#4CAF50"/>
    }
  };

  useEffect(() => {
    const loadAllModels = async () => {
      try {
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
        const [objModel] = await Promise.all([
          cocoSsd.load(),
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ]);
        objectModelRef.current = objModel;
        setIsModelsLoaded(true);
      } catch (e) {
        console.error("Failed to load models:", e);
      }
    };
    loadAllModels();
    
    return () => stopVideo();
  }, []);

  const startVideo = () => {
    setIsActive(true);
    setSuggestion(null);
    setActivity("Scanning Environment...");
    
    // Start Camera
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => console.error("Error accessing webcam: ", err));

    // Start Live Audio Transcription
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognitionRef.current = recognition;

      recognition.onresult = (event) => {
        // Only grab the very latest sentence they spoke so it never freezes
        const latestTranscript = event.results[event.results.length - 1][0].transcript;
        setTranscript(latestTranscript);
        
        // Analyze Audio Transcript for Emotions
        const lowerTranscript = latestTranscript.toLowerCase();
        if (lowerTranscript.includes("sad") || lowerTranscript.includes("depressed")) {
            triggerPopup('sad', 'audio');
        } else if (lowerTranscript.includes("angry") || lowerTranscript.includes("mad")) {
            triggerPopup('angry', 'audio');
        } else if (lowerTranscript.includes("scared") || lowerTranscript.includes("anxious") || lowerTranscript.includes("fear")) {
            triggerPopup('fearful', 'audio');
        } else if (lowerTranscript.includes("happy") || lowerTranscript.includes("joy")) {
            triggerPopup('happy', 'audio');
        }
      };

      // CRITICAL FIX: Chrome automatically stops the microphone if you are silent. This forces it to turn back on!
      recognition.onend = () => {
        if (videoRef.current && videoRef.current.srcObject) {
           try { recognition.start(); } catch(e) {}
        }
      };
      
      try {
        recognition.start();
      } catch (e) {
        console.error("Mic already started");
      }
    }
  };

  const stopVideo = () => {
    setIsActive(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setEmotion(null);
    setActivity("Offline");
    setTranscript("");
  };

  const triggerPopup = (key, triggerType) => {
    const now = Date.now();
    const lastTriggered = triggerHistoryRef.current[key] || 0;
    
    // Check if 30 seconds have passed since THIS SPECIFIC item was last triggered
    if (!cooldown && (now - lastTriggered > 30000)) {
       setSuggestion({ ...recommendations[key], trigger: triggerType });
       setCooldown(true);
       triggerHistoryRef.current[key] = now;
    }
  };

  const handleVideoPlay = () => {
    const interval = setInterval(async () => {
      if (videoRef.current && isActive && isModelsLoaded && !suggestion && !cooldown) {
        
        // 1. Run Object Detection for User Physical Activity
        const objects = await objectModelRef.current.detect(videoRef.current);
        const objectNames = objects.map(obj => obj.class);

        let currentPhysicalActivity = null;
        
        // Check objects strictly for pop-ups
        if (objectNames.includes("cell phone")) {
            currentPhysicalActivity = "Scrolling on Phone";
            triggerPopup('cellphone', 'activity');
        } else if (objectNames.includes("cup") || objectNames.includes("bottle") || objectNames.includes("wine glass")) {
            currentPhysicalActivity = "Drinking / Hydrating";
            triggerPopup('hydration', 'activity');
        } else if (objectNames.includes("book")) {
            currentPhysicalActivity = "Reading a Book";
            triggerPopup('reading', 'activity');
        } else if (objectNames.includes("laptop") || objectNames.includes("keyboard")) {
            currentPhysicalActivity = "Typing on Laptop";
            triggerPopup('typing', 'activity');
        }

        // 2. Run Face Detection for Emotion
        const faceDetections = await faceapi.detectSingleFace(
          videoRef.current, 
          new faceapi.TinyFaceDetectorOptions()
        ).withFaceExpressions();

        if (faceDetections) {
          const expressions = faceDetections.expressions;
          const highestEmotion = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);
          setEmotion(highestEmotion);

          if (!currentPhysicalActivity) {
            // ONLY trigger pop-ups for intense emotions now, NOT for neutral face.
            if (highestEmotion === 'neutral') {
              setActivity("Idle / Thinking");
            } else {
              setActivity("Expressive / Active");
              if (['sad', 'angry', 'fearful', 'happy'].includes(highestEmotion)) {
                 triggerPopup(highestEmotion, 'emotion');
              }
            }
          } else {
            setActivity(currentPhysicalActivity);
          }
        } else {
          setEmotion("Undetected");
          setActivity(currentPhysicalActivity || "Away or Idle");
        }

      } else if (!isActive) {
        clearInterval(interval);
      }
    }, 1500); 
  };

  const closePopup = () => {
    setSuggestion(null);
    setTimeout(() => setCooldown(false), 5000);
  };

  return (
    <div className="tab-container flex-col" style={{ alignItems: 'center', position: 'relative' }}>
      <header className="header" style={{ marginBottom: '1rem', marginTop: '1rem' }}>
        <Camera className="logo-icon" />
        <h2>Universal Live Tracker</h2>
      </header>

      {!isModelsLoaded ? (
        <div className="center-content">
          <span className="loader"></span>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Booting Face & Object AI Engines...</p>
        </div>
      ) : (
        <div className="video-container" style={{ position: 'relative', width: '100%', maxWidth: '350px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 15px 35px rgba(0,0,0,0.2)' }}>
          
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline
            onPlay={handleVideoPlay}
            style={{ width: '100%', display: isActive ? 'block' : 'none', transform: 'scaleX(-1)' }}
          />

          {!isActive && (
            <div style={{ width: '100%', height: '400px', background: 'var(--input-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--card-border)' }}>
              <Camera size={56} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
              <button className="pulse-btn" onClick={startVideo}>
                Start AI Scan
              </button>
            </div>
          )}

          {/* Dual Overlay: Emotion and Activity */}
          <AnimatePresence>
            {isActive && !suggestion && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ position: 'absolute', top: '1rem', left: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
              >
                <div style={{ background: 'rgba(0,0,0,0.6)', padding: '0.5rem 1rem', borderRadius: '20px', color: '#fff', backdropFilter: 'blur(10px)', fontWeight: 'bold' }}>
                  Emotion: <span style={{ textTransform: 'capitalize', color: 'var(--accent-color)' }}>{emotion || '...'}</span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.6)', padding: '0.5rem 1rem', borderRadius: '20px', color: '#fff', backdropFilter: 'blur(10px)', fontSize: '0.85rem' }}>
                  Action: <span style={{ color: '#ffb347' }}>{activity}</span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.6)', padding: '0.5rem 1rem', borderRadius: '20px', color: '#fff', backdropFilter: 'blur(10px)', fontSize: '0.85rem', maxWidth: '250px' }}>
                  Mic: <span style={{ color: '#E1306C', fontStyle: 'italic' }}>"{transcript || 'Listening...'}"</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isActive && (
            <button 
              onClick={stopVideo}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,0,0,0.7)', border: 'none', color: '#fff', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer' }}
            >
              <XCircle size={20} />
            </button>
          )}
        </div>
      )}

      {/* FULL SCREEN POP-UP MODAL */}
      <AnimatePresence>
        {suggestion && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
          >
            <motion.div 
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '24px', padding: '2rem', width: '100%', maxWidth: '350px', textAlign: 'center', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
            >
              <button onClick={closePopup} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', color: 'var(--text-muted)' }}>
                <X size={24} />
              </button>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', marginTop: '1rem' }}>
                <div style={{ background: 'var(--input-bg)', padding: '1rem', borderRadius: '50%' }}>
                  {suggestion.icon}
                </div>
              </div>

              {/* Show exactly what triggered it */}
              <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--accent-color)', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                {suggestion.trigger === 'activity' ? "Object / Activity Triggered" : suggestion.trigger === 'audio' ? "Live Audio Triggered" : "Facial Emotion Triggered"}
              </div>

              <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: 'var(--text-main)', lineHeight: '1.3' }}>
                {suggestion.title}
              </h2>

              {suggestion.type === 'link' ? (
                <a 
                  href={suggestion.content}
                  target="_blank"
                  rel="noreferrer"
                  onClick={closePopup}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, var(--accent-color), #a180ff)', color: '#fff', textDecoration: 'none', padding: '1rem 1.5rem', borderRadius: '30px', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '1rem', boxShadow: '0 10px 20px rgba(102, 252, 241, 0.3)' }}
                >
                  {suggestion.actionText} <ExternalLink size={18} />
                </a>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', background: 'var(--input-bg)', padding: '1rem', borderRadius: '12px', fontStyle: 'italic', marginTop: '1rem' }}>
                  {suggestion.content}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
