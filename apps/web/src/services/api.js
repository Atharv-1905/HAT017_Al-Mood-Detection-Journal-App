import axios from 'axios';
import { emitToast } from './toastBus';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

function getErrorMessage(error, fallback) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (first?.msg) return first.msg;
  }
  return fallback;
}
// Attach JWT from localStorage to every request if present
apiClient.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('mindtrace_jwt');
    if (token) config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
  } catch (e) {
    // ignore (e.g., SSR/no localStorage)
  }
  return config;
}, (error) => Promise.reject(error));

// ── Auth (login / signup) ─────────────────────────────
export const login = async (email, password) => {
  try {
    const res = await apiClient.post('/login', { email, password });
    const token = res?.data?.token || res?.data?.access_token;
    if (token) localStorage.setItem('mindtrace_jwt', token);
    return {
      ...res.data,
      token,
      user: res?.data?.user || {
        user_id: res?.data?.user_id,
        username: res?.data?.username,
      },
    };
  } catch (e) {
    console.error('Login failed', e);
    emitToast(getErrorMessage(e, 'Login failed. Check credentials and backend connectivity.'), 'error');
    throw e;
  }
};

export const signup = async (profile) => {
  try {
    const normalizedPayload = {
      // FastAPI expects these fields
      username: profile.username,
      email: profile.email,
      password: profile.password,
      full_name: profile.full_name,
    };
    const res = await apiClient.post('/signup', normalizedPayload);
    const token = res?.data?.token || res?.data?.access_token;
    if (token) localStorage.setItem('mindtrace_jwt', token);
    return {
      ...res.data,
      token,
      user: res?.data?.user || {
        user_id: res?.data?.user_id,
        username: res?.data?.username,
      },
    };
  } catch (e) {
    console.error('Signup failed', e);
    emitToast(getErrorMessage(e, 'Signup failed. Please verify all required fields.'), 'error');
    throw e;
  }
};

// ── Analyze Live ───────────────────────────────────────
export const analyzeLive = async (text) => {
  try {
    const response = await apiClient.post('/analyze-live', { text });
    return response.data;
  } catch (e) {
    console.error('analyzeLive failed', e);
    emitToast('Failed to analyze journal text. Is the backend running?', 'error');
    throw e;
  }
};

// ── SOS ────────────────────────────────────────────────
export const triggerSOS = async () => {
  try {
    const response = await apiClient.post('/trigger-sos', {
      contacts: [{ name: 'Emergency', email: 'help@mindtrace.local', relationship: 'emergency_contact' }],
      wellness_index: 10, emotion: 'crisis', message: 'Automated distress signal.',
    });
    return response.data;
  } catch (e) {
    console.error('triggerSOS failed', e);
    emitToast('Failed to trigger SOS. Please verify backend connectivity.', 'error');
    throw e;
  }
};

// ── Save Journal ───────────────────────────────────────
export const saveJournal = async (text, analysis) => {
  try {
    const response = await apiClient.post('/save-journal', {
      title: 'Journal Entry',
      content: text,
      tags: [],
      mood_override: analysis?.emotion || null,
    });
    return response.data;
  } catch (e) {
    console.error('saveJournal failed', e);
    emitToast('Failed to save journal entry. Please try again later.', 'error');
    throw e;
  }
};

// ── Dashboard Analytics ────────────────────────────────
export const getDashboardAnalytics = async () => {
  try {
    const response = await apiClient.get('/dashboard-analytics?limit=90');
    return response.data;
  } catch (e) {
    console.error('getDashboardAnalytics failed', e);
    emitToast('Failed to load dashboard analytics. Is the backend running?', 'error');
    throw e;
  }
};

// ── Vision / Facial Logs ─────────────────────────────
export const analyzeVisionLive = async (base64Frame) => {
  try {
    const response = await apiClient.post('/analyze-vision-live', { frame: base64Frame });
    return response.data;
  } catch (e) {
    console.error('analyzeVisionLive failed', e);
    emitToast('Failed to analyze webcam frame. Is the vision API available?', 'error');
    throw e;
  }
};

export const saveFacialLog = async (payload) => {
  try {
    const response = await apiClient.post('/facial-emotion-logs', payload);
    return response.data;
  } catch (e) {
    console.error('saveFacialLog failed', e);
    // Non-blocking: warn user but don't throw
    emitToast('Warning: could not persist facial log to server.', 'info');
    return null;
  }
};

export const getFacialLogs = async ({ limit = 100 } = {}) => {
  try {
    const response = await apiClient.get(`/facial-emotion-logs?limit=${limit}`);
    return response.data?.logs || response.data || [];
  } catch (e) {
    console.error('getFacialLogs failed', e);
    emitToast('Failed to fetch facial logs. Is the backend reachable?', 'error');
    return [];
  }
};

export const getUserProfileHistory = async () => {
  try {
    const token = localStorage.getItem('mindtrace_jwt');
    const response = await axios.get('http://localhost:5000/api/user-profile/history', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (e) {
    console.error('getUserProfileHistory failed', e);
    return null;
  }
};
