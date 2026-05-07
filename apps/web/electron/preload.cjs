/**
 * MindTrace AI+ — Electron Preload Script
 * ========================================
 * Secure bridge between the renderer (React) and main (Node) process.
 * Uses contextBridge to expose only the APIs the renderer needs.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ─── Platform detection ────────────────────────────────
  isElectron: true,
  platform: process.platform,

  // ─── Native Notifications ──────────────────────────────
  showNotification: ({ title, body, emotion, confidence }) => {
    ipcRenderer.send('show-notification', { title, body, emotion, confidence });
  },

  // ─── Overlay / Breathing Window ────────────────────────
  showOverlay: () => ipcRenderer.send('show-overlay'),
  closeOverlay: () => ipcRenderer.send('close-overlay'),

  // ─── Monitoring control (from tray) ────────────────────
  onMonitoringToggle: (callback) => {
    const handler = (_event, enabled) => callback(enabled);
    ipcRenderer.on('monitoring-toggle', handler);
    return () => ipcRenderer.removeListener('monitoring-toggle', handler);
  },

  // ─── Breathing trigger (from notification click) ───────
  onOpenBreathing: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('open-breathing', handler);
    return () => ipcRenderer.removeListener('open-breathing', handler);
  },

  // ─── Auto-launch ───────────────────────────────────────
  getAutoLaunch: () => ipcRenderer.invoke('get-auto-launch'),
  setAutoLaunch: (enabled) => ipcRenderer.invoke('set-auto-launch', enabled),

  // ─── Monitoring state ──────────────────────────────────
  getMonitoringState: () => ipcRenderer.invoke('get-monitoring-state'),
});
