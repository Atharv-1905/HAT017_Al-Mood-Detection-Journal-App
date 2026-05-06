import React from 'react';
import { FastForward, CalendarClock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DevTimeTravel({ timeTravelOffset, setTimeTravelOffset }) {
  const options = [
    { id: 'present', label: 'Present Day' },
    { id: '1_week', label: '+1 Week' },
    { id: '1_month', label: '+1 Month' },
  ];

  return (
    <motion.div 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed bottom-6 right-6 z-50 flex items-center bg-gray-900 text-white rounded-full p-2 shadow-2xl border border-gray-700"
    >
      <div className="flex items-center pl-4 pr-2 border-r border-gray-700">
        <FastForward className="w-4 h-4 text-primary mr-2" />
        <span className="text-xs font-bold uppercase tracking-wider text-gray-300 mr-2">Dev Mode:</span>
      </div>
      
      <div className="flex px-1 space-x-1">
        {options.map(opt => (
          <button
            key={opt.id}
            onClick={() => setTimeTravelOffset(opt.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              timeTravelOffset === opt.id 
                ? 'bg-primary text-gray-900' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
