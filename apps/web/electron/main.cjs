/**
 * MindTrace AI+ — Electron Main Process
 * ======================================
 * Wraps the existing React/Vite frontend in a native desktop shell.
 * Handles: tray, auto-launch, native notifications, overlay windows.
 */
const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  Notification,
  ipcMain,
  nativeImage,
  screen,
} = require('electron');
const path = require('path');
const AutoLaunch = require('auto-launch');

// ─── Constants ───────────────────────────────────────────
const IS_DEV = !app.isPackaged;
const VITE_DEV_URL = 'http://localhost:5173';
const DIST_PATH = path.join(__dirname, '..', 'dist');
const PRELOAD_PATH = path.join(__dirname, 'preload.js');
const ICON_PATH = path.join(__dirname, '..', 'public', 'favicon.svg');

let mainWindow = null;
let overlayWindow = null;
let tray = null;
let monitoringPaused = false;

// ─── Auto-Launch on system boot ──────────────────────────
const autoLauncher = new AutoLaunch({
  name: 'MindTrace AI+',
  isHidden: true,
});

// ─── Single Instance Lock ────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ─── Create Main Window ──────────────────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: 'MindTrace AI+',
    icon: ICON_PATH,
    show: false, // Show when ready to prevent flicker
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Needed for preload to use require
    },
  });

  // Load content
  if (IS_DEV) {
    mainWindow.loadURL(VITE_DEV_URL);
  } else {
    mainWindow.loadFile(path.join(DIST_PATH, 'index.html'));
  }

  // Graceful show
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Minimize to tray instead of closing
  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  // Open DevTools in development
  if (IS_DEV) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

// ─── Create Overlay (Always-on-Top Breathing) ────────────
function createOverlayWindow() {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.show();
    overlayWindow.focus();
    return;
  }

  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;

  overlayWindow = new BrowserWindow({
    width: 420,
    height: 340,
    x: Math.round(screenW / 2 - 210),
    y: Math.round(screenH / 2 - 170),
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    focusable: true,
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  overlayWindow.loadFile(path.join(__dirname, 'overlay.html'));

  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });
}

// ─── System Tray ─────────────────────────────────────────
function createTray() {
  const icon = nativeImage.createFromPath(ICON_PATH).resize({ width: 20, height: 20 });
  tray = new Tray(icon);
  tray.setToolTip('MindTrace AI+');

  const updateTrayMenu = () => {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open MindTrace',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      { type: 'separator' },
      {
        label: monitoringPaused ? 'Resume Monitoring' : 'Pause Monitoring',
        click: () => {
          monitoringPaused = !monitoringPaused;
          mainWindow?.webContents.send('monitoring-toggle', !monitoringPaused);
          updateTrayMenu();
        },
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.isQuitting = true;
          app.quit();
        },
      },
    ]);
    tray.setContextMenu(contextMenu);
  };

  updateTrayMenu();

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ─── IPC Handlers ────────────────────────────────────────

// Native notification from renderer
ipcMain.on('show-notification', (_event, { title, body, emotion, confidence }) => {
  if (!Notification.isSupported()) return;

  const notif = new Notification({
    title: title || 'MindTrace Alert 🧠',
    body: body || `Distress detected (${emotion} at ${confidence}%). Click for a breathing exercise.`,
    icon: ICON_PATH,
    urgency: 'critical',
    silent: false,
  });

  notif.on('click', () => {
    // Restore main window
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
    // Tell renderer to open breathing UI
    mainWindow?.webContents.send('open-breathing');
  });

  notif.show();
});

// Overlay trigger from renderer
ipcMain.on('show-overlay', () => {
  createOverlayWindow();
});

// Close overlay
ipcMain.on('close-overlay', () => {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.close();
  }
});

// Auto-launch toggle
ipcMain.handle('get-auto-launch', async () => {
  try { return await autoLauncher.isEnabled(); } catch { return false; }
});

ipcMain.handle('set-auto-launch', async (_event, enabled) => {
  try {
    if (enabled) { await autoLauncher.enable(); }
    else { await autoLauncher.disable(); }
    return true;
  } catch { return false; }
});

// Get monitoring state
ipcMain.handle('get-monitoring-state', () => !monitoringPaused);

// ─── App Lifecycle ───────────────────────────────────────
app.whenReady().then(async () => {
  createMainWindow();
  createTray();

  // Enable auto-launch by default on first run
  try {
    const isEnabled = await autoLauncher.isEnabled();
    if (!isEnabled) await autoLauncher.enable();
  } catch (e) {
    console.warn('Auto-launch setup failed:', e);
  }
});

app.on('window-all-closed', () => {
  // Don't quit — we live in the tray
});

app.on('activate', () => {
  // macOS dock click
  if (!mainWindow || mainWindow.isDestroyed()) {
    createMainWindow();
  } else {
    mainWindow.show();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
});
