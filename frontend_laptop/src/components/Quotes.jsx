import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, BellRing } from 'lucide-react';

const DAILY_QUOTES = [
  { text: "Your present circumstances don't determine where you can go; they merely determine where you start.", author: "Nido Qubein" },
  { text: "You don't have to control your thoughts. You just have to stop letting them control you.", author: "Dan Millman" },
  { text: "There is hope, even when your brain tells you there isn’t.", author: "John Green" },
  { text: "Healing takes time, and asking for help is a courageous step.", author: "Mariska Hargitay" },
  { text: "Take a deep breath. It’s just a bad day, not a bad life.", author: "Unknown" },
  { text: "Out of suffering have emerged the strongest souls.", author: "A.E. Woodward" },
  { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela" }
];

const NATURE_IMAGES = [
  "https://picsum.photos/seed/forest1/600/800",
  "https://picsum.photos/seed/mountain2/600/800",
  "https://picsum.photos/seed/river3/600/800",
  "https://picsum.photos/seed/ocean4/600/800",
  "https://picsum.photos/seed/sunset5/600/800",
  "https://picsum.photos/seed/valley6/600/800",
  "https://picsum.photos/seed/stars7/600/800"
];

export default function Quotes() {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [notificationStatus, setNotificationStatus] = useState(Notification.permission);

  const nextQuote = () => setQuoteIndex((prev) => (prev + 1) % DAILY_QUOTES.length);
  const prevQuote = () => setQuoteIndex((prev) => (prev === 0 ? DAILY_QUOTES.length - 1 : prev - 1));

  // Auto-change every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      nextQuote();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const enableNotifications = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notification");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationStatus(permission);
    if (permission === 'granted') {
      new Notification("MindTrace AI", { body: "Notifications enabled!" });
    }
  };

  const testHourlyPing = () => {
    if (Notification.permission === 'granted') {
      // STRICTLY Native Push Notification
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(function(registration) {
          registration.showNotification("Hourly Check-in 🕒", {
            body: "It's time to take a deep breath. How are you feeling?",
            vibrate: [200, 100, 200]
          });
        }).catch(() => {
          new Notification("Hourly Check-in 🕒", { body: "It's time to take a deep breath. How are you feeling?" });
        });
      } else {
        new Notification("Hourly Check-in 🕒", { body: "It's time to take a deep breath. How are you feeling?" });
      }
    } else {
      alert("Please enable OS notifications first by clicking the button below!");
    }
  };

  return (
    <div className="tab-container flex-col" style={{ alignItems: 'center', position: 'relative', overflowX: 'hidden' }}>
      
      <header className="header" style={{ marginBottom: '1rem', marginTop: '1rem' }}>
        <Quote className="logo-icon" />
        <h2>Daily Inspiration</h2>
      </header>

      {/* SWIPEABLE CARD WITH PRELOADED BACKGROUNDS */}
      <motion.div 
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={(e, info) => {
          if (info.offset.y < -50) nextQuote();      // Swipe Up -> Next
          else if (info.offset.y > 50) prevQuote();  // Swipe Down -> Prev
        }}
        style={{ width: '100%', maxWidth: '350px', position: 'relative', overflow: 'hidden', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', height: '450px', cursor: 'grab', touchAction: 'none' }}
      >
        {/* Render ALL images to preload them and fix the delay bug! */}
        {NATURE_IMAGES.map((img, i) => (
          <div 
            key={i}
            style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              backgroundImage: `url(${img})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              zIndex: 0,
              opacity: i === quoteIndex ? 1 : 0,
              transition: 'opacity 0.8s ease-in-out' // Smooth crossfade!
            }}
          />
        ))}

        {/* Constant Glassmorphism Blur Overlay */}
        <div 
          style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 1
          }}
        />
        
        {/* Animated Text Content */}
        <div style={{ position: 'relative', zIndex: 2, padding: '2.5rem', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Quote size={50} color="rgba(255,255,255,0.2)" style={{ position: 'absolute', top: '1.5rem', left: '1.5rem' }} />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={quoteIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
            >
              <p style={{ fontSize: '1.4rem', color: '#ffffff', lineHeight: '1.6', fontStyle: 'italic', marginBottom: '1.5rem', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                "{DAILY_QUOTES[quoteIndex].text}"
              </p>
              <div style={{ color: '#4fd1c5', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.9rem', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                — {DAILY_QUOTES[quoteIndex].author}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Scroll Helper Icon */}
        <div style={{ position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', zIndex: 3, color: 'rgba(255,255,255,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Swipe Up / Down</div>
          <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>↓</motion.div>
        </div>
      </motion.div>

      {/* Hourly Notification Settings */}
      <div style={{ marginTop: '2rem', width: '100%', maxWidth: '350px', background: 'var(--input-bg)', padding: '1.5rem', borderRadius: '20px', textAlign: 'center', paddingBottom: '3rem' }}>
        <BellRing size={28} color="#ffb347" style={{ marginBottom: '0.5rem' }} />
        <h3 style={{ marginBottom: '0.5rem' }}>Hourly Reminders</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
          Get a gentle ping on your phone every hour to track your mood and activity.
        </p>

        {notificationStatus !== 'granted' && (
          <button className="pulse-btn" onClick={enableNotifications} style={{ width: '100%', marginBottom: '1rem' }}>
            Enable OS Notifications
          </button>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notificationStatus === 'granted' && (
            <div style={{ color: '#4CAF50', fontWeight: 'bold' }}>✓ OS Notifications Active</div>
          )}
          {/* <button 
            onClick={testHourlyPing}
            style={{ background: 'var(--accent-color)', color: '#000', border: 'none', padding: '1rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 10px 20px rgba(102, 252, 241, 0.3)' }}
          >
            Test Notification Now
          </button> */}
        </div>
      </div>
    </div>
  );
}
