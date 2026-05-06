import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function BreathingIntervention({ onComplete }) {
  const [phase, setPhase] = useState('Let\'s slow down');

  useEffect(() => {
    // Sequence: 
    // 0s-2s: "Let's slow down"
    // 2s-6s: Inhale (4s)
    // 6s-10s: Hold (4s)
    // 10s-16s: Exhale (6s)
    // 16s+: Done

    const t1 = setTimeout(() => setPhase('Inhale...'), 2000);
    const t2 = setTimeout(() => setPhase('Hold...'), 6000);
    const t3 = setTimeout(() => setPhase('Exhale slowly...'), 10000);
    const t4 = setTimeout(() => onComplete(), 16000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm"
    >
      <h2 className="text-3xl font-semibold text-text mb-12 h-10 transition-all duration-700 ease-in-out">
        {phase}
      </h2>

      {phase !== 'Let\'s slow down' && (
        <motion.div 
          className="breathing-circle w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center"
          animate={{
            scale: phase === 'Inhale...' || phase === 'Hold...' ? 1.5 : 1,
            opacity: phase === 'Inhale...' || phase === 'Hold...' ? 1 : 0.6
          }}
          transition={{
            duration: phase === 'Inhale...' ? 4 : phase === 'Exhale slowly...' ? 6 : 4,
            ease: "easeInOut"
          }}
        />
      )}

      <button 
        onClick={onComplete}
        className="mt-24 px-6 py-2 text-text-light hover:text-text transition-colors border border-transparent hover:border-gray-300 rounded-full"
      >
        Skip exercise
      </button>
    </motion.div>
  );
}
