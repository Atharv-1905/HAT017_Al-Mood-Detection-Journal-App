import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { subscribeToasts } from '../services/toastBus';

const ICONS = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
};

const COLORS = {
  error: 'border-red-200 bg-red-50 text-red-700',
  success: 'border-green-200 bg-green-50 text-green-700',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
};

export default function GlobalToasts() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsub = subscribeToasts((toast) => {
      setToasts((prev) => [...prev, toast].slice(-4));
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 3600);
    });
    return unsub;
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 w-[min(92vw,360px)]">
      {toasts.map((t) => {
        const Icon = ICONS[t.type] || ICONS.info;
        const color = COLORS[t.type] || COLORS.info;
        return (
          <div key={t.id} className={`border rounded-xl px-4 py-3 shadow-lg ${color}`}>
            <div className="flex items-start gap-2">
              <Icon className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-sm leading-snug">{t.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
