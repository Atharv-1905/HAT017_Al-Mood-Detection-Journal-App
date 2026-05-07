/**
 * MindTrace AI+ — Electron Bridge
 * ================================
 * Provides a unified API that works in both Browser and Electron contexts.
 * In Electron: uses native IPC via window.electronAPI (from preload.js).
 * In Browser:  falls back to Web Notification API / no-ops.
 */

/** Check if running inside Electron */
export const isElectron = () => !!(window.electronAPI?.isElectron);

/**
 * Send a native notification.
 * - Electron: uses Electron Notification (always works, no permission needed)
 * - Browser: uses Web Notification API (requires prior permission)
 */
export function sendNativeNotification({ title, body, emotion, confidence, onClickBreathing }) {
  if (isElectron()) {
    window.electronAPI.showNotification({ title, body, emotion, confidence });
    // Breathing open is handled via IPC listener (onOpenBreathing)
    return;
  }

  // Browser fallback
  if (Notification.permission !== 'granted') return;

  const notif = new Notification(title || 'MindTrace Alert 🧠', {
    body: body || `You seem stressed. Click for a quick breathing exercise.`,
    icon: '/favicon.svg',
    tag: 'mindtrace-distress',
    requireInteraction: true,
  });

  notif.onclick = () => {
    window.focus();
    if (onClickBreathing) onClickBreathing();
    notif.close();
  };
}

/**
 * Show the always-on-top breathing overlay (Electron only).
 * In browser this is a no-op — the React BreathingIntervention renders inline.
 */
export function showOverlay() {
  if (isElectron()) {
    window.electronAPI.showOverlay();
  }
}

/**
 * Subscribe to monitoring toggle events from the tray.
 * Returns an unsubscribe function.
 */
export function onMonitoringToggle(callback) {
  if (isElectron()) {
    return window.electronAPI.onMonitoringToggle(callback);
  }
  return () => {};
}

/**
 * Subscribe to "open breathing" events (from notification click in main process).
 * Returns an unsubscribe function.
 */
export function onOpenBreathing(callback) {
  if (isElectron()) {
    return window.electronAPI.onOpenBreathing(callback);
  }
  return () => {};
}

/**
 * Auto-launch controls.
 */
export async function getAutoLaunch() {
  if (isElectron()) return window.electronAPI.getAutoLaunch();
  return false;
}

export async function setAutoLaunch(enabled) {
  if (isElectron()) return window.electronAPI.setAutoLaunch(enabled);
  return false;
}
